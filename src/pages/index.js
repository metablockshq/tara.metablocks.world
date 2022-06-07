import { useEffect, useState } from "react";
import { api } from "@kyraa/metablocks";
import { hooks } from "@kyraa/solana";
import { Callout, Intent, Button, ProgressBar, Tag } from "@blueprintjs/core";

import { scale } from "~/utils/number";
import { isValidHttpUrl } from "~/utils/string";
import { useAtom, useResource } from "~/hooks";

import tokenState, {
  getMetadataFromMint,
  getParsedProgramAccounts,
  filterEmptyProgramAccounts,
} from "~/domain/token";

import universeState, {
  depositNft,
  getUserNfts,
  withdrawNft,
  fetchDepositedNfts,
} from "~/domain/universe";

const { useConnection, useWallet } = hooks;

const computeLoadingState = ({
  positiveBalanceProgramAccounts,
  gettingMetadataFromMint,
  gettingParsedProgramAccounts,
  metadataFromMint,
}) => {
  // just got started
  if (gettingParsedProgramAccounts)
    return { message: "Parsing tokens in your wallet", progress: 10 };

  // have program accounts
  if (positiveBalanceProgramAccounts && !metadataFromMint)
    return {
      message: `Fetching metadata for ${positiveBalanceProgramAccounts.length} tokens`,
      progress: 20,
    };

  // if all gettingMetadataFromMint are false, but no metadataFromMints, it means we didn't start
  // if all gettingMetadataFromMint are false, but some metadataFromMints ewe are fetching
  if (
    positiveBalanceProgramAccounts &&
    gettingMetadataFromMint &&
    metadataFromMint &&
    // have got metadata for some
    Object.values(metadataFromMint).length > 0 &&
    // some are loading
    Object.values(gettingMetadataFromMint).some(Boolean)
  ) {
    // this returns between 20 and 70
    const totalMetadataToFetch = positiveBalanceProgramAccounts.length;
    const fetched = Object.values(metadataFromMint).length;
    const completePercentage = fetched / totalMetadataToFetch;
    return {
      message: `Fetching metadata for ${positiveBalanceProgramAccounts.length} tokens`,
      progress: scale(completePercentage, 0, 1, 20, 70),
    };
  }

  if (
    positiveBalanceProgramAccounts &&
    gettingMetadataFromMint &&
    metadataFromMint &&
    // fetched for all
    Object.values(metadataFromMint).length ===
      positiveBalanceProgramAccounts.length &&
    Object.values(gettingMetadataFromMint).every((x) => !x) // all are false
  )
    return {
      message: "Fetched all metadata.",
      progress: 100,
    };

  return { message: "Setting up the arc reactor", progress: 8 };
};

const Progress = ({ positiveBalanceProgramAccounts }) => {
  const [loadingState, setLoadingState] = useState({
    progress: 0,
    message: "",
  });
  const {
    gettingMetadataFromMint,
    gettingParsedProgramAccounts,
    metadataFromMint,
  } = useAtom(tokenState);

  useEffect(() => {
    setLoadingState(
      computeLoadingState({
        positiveBalanceProgramAccounts,
        gettingMetadataFromMint,
        gettingParsedProgramAccounts,
        metadataFromMint,
      })
    );
  }, [gettingMetadataFromMint, gettingParsedProgramAccounts]);
  return (
    <div>
      {loadingState.message}
      <ProgressBar value={loadingState.progress / 100} />
    </div>
  );
};

function MetadataCardContent({ data, metadata }) {
  const isDeposited = metadata.data.data.name === "MetablocksReceiptNft";
  const wallet = useWallet();
  const { connection } = useConnection();
  const { depositingNft, withdrawingNft } = useAtom(universeState);
  return (
    <div className="">
      <p className="text-gray-600">{data.description}</p>
      <div className="mt-2 flex flex-wrap justify-start">
        <Tag minimal round icon="dollar" className="mr-2 mt-2">
          {data.symbol}
        </Tag>
        {data.attributes.map((a) => (
          <Tag
            key={a.trait_type}
            icon="tag"
            minimal
            round
            className="mt-2 mr-2"
          >
            {a.trait_type}: {a.value}
          </Tag>
        ))}
      </div>
      <Button
        text={
          isDeposited ? "Withdraw from universe" : "Deposit to Tara Universe"
        }
        className="mt-4"
        onClick={() => {
          (isDeposited ? withdrawNft : depositNft)({
            wallet,
            connection,
            metadata,
          });
          // depositNft({ wallet, connection, metadata });
        }}
        fill
        loading={depositingNft || withdrawingNft}
        intent={isDeposited ? null : Intent.PRIMARY}
      />
    </div>
  );
}

function MetadataCardLoading() {
  return <div className="h-32 rounded bg-slate-100" />;
}

const MetadataCard = ({ metadata }) => {
  const { name, uri } = metadata.data.data;
  if (isValidHttpUrl(uri)) {
    const { data, error, isLoading } = useResource(uri);

    return (
      <div className="mb-4 overflow-hidden relative bg-white shadow-lg ring-1 ring-black/5 rounded-xl flex items-center gap-6">
        {!isLoading && !error && (
          <img
            className="absolute -left-6 w-24 h-24 rounded-full shadow-lg"
            src={data.image}
          />
        )}

        <div className="flex flex-col py-5 pr-4 pl-24">
          <strong className="text-slate-900 text-sm font-medium">{name}</strong>
          <span className="text-slate-500 text-sm font-medium">
            {!isLoading && data && (
              <MetadataCardContent data={data} metadata={metadata} />
            )}
            {isLoading && <MetadataCardLoading />}
          </span>
        </div>
      </div>
    );
  } else {
    return <div>Invalid URI</div>;
  }
};

const MetadataList = ({ title, metadataFromMint }) => {
  return (
    <div className="pr-2">
      <Callout title={title} className="mb-4" icon="box" />

      {Object.keys(metadataFromMint).map((mint) => {
        return <MetadataCard key={mint} metadata={metadataFromMint[mint]} />;
      })}
    </div>
  );
};

const MetaNftLayer = ({ metadata }) => {
  const { name, uri } = metadata.data.data;

  if (isValidHttpUrl(uri)) {
    const { data, error, isLoading } = useResource(uri);

    const zIndex = data?.attributes?.find(
      (a) => a.trait_type === "zIndex"
    ).value;

    return (
      <div className="absolute" style={{ zIndex }}>
        {!isLoading && !error && <img src={data.image} />}
      </div>
    );
  } else {
    return <div>Invalid URI</div>;
  }
};

const MetaNft = ({}) => {
  const { metadataFromMint } = useAtom(tokenState);

  const inContractMetadata = Object.fromEntries(
    Object.entries(metadataFromMint).filter(
      ([key, value]) => value.data.data.name === "MetablocksMetaNft"
    )
  );

  return (
    <div className="pr-2 flex flex-col">
      <Callout
        title={"Meta Nft"}
        className="mb-4"
        icon="inner-join"
        intent={Intent.PRIMARY}
      ></Callout>

      <div className="relative">
        {Object.keys(inContractMetadata).map((k) => {
          return <MetaNftLayer key={k} metadata={inContractMetadata[k]} />;
        })}
      </div>
    </div>
  );
};

const ViewNfts = () => {
  const wallet = useWallet();
  const { connection } = useConnection();

  const [positiveBalanceProgramAccounts, setPositiveBalanceProgramAccounts] =
    useState(null);

  const {
    gettingParsedProgramAccounts,
    parsedProgramAccounts,
    gettingMetadataFromMint,
    metadataFromMint,
  } = useAtom(tokenState);

  const inWalletMetadata = Object.fromEntries(
    Object.entries(metadataFromMint).filter(
      ([key, value]) =>
        value.data.data.name !== "MetablocksReceiptNft" &&
        value.data.data.name !== "MetablocksMetaNft"
    )
  );

  useEffect(() => {
    if (wallet && wallet.publicKey)
      getParsedProgramAccounts(connection, wallet);

    if (wallet && wallet.publicKey) getUserNfts({ wallet, connection });
  }, [wallet]);

  useEffect(() => {
    const filtered = filterEmptyProgramAccounts(parsedProgramAccounts);
    setPositiveBalanceProgramAccounts(filtered);
    filtered.map((pa) =>
      getMetadataFromMint(connection, pa.account.data.parsed.info.mint)
    );
  }, [parsedProgramAccounts]);

  const isLoading =
    positiveBalanceProgramAccounts &&
    metadataFromMint &&
    positiveBalanceProgramAccounts.length !==
      Object.values(metadataFromMint).length;

  return (
    <div>
      {isLoading && (
        <Progress
          positiveBalanceProgramAccounts={positiveBalanceProgramAccounts}
        />
      )}
      {!isLoading && (
        <div>
          <MetadataList
            title="NFTs in your wallet"
            metadataFromMint={inWalletMetadata}
          />
        </div>
      )}
    </div>
  );
};

const ViewNftsInUniverse = () => {
  const { metadataFromMint } = useAtom(tokenState);

  const inContractMetadata = Object.fromEntries(
    Object.entries(metadataFromMint).filter(
      ([key, value]) => value.data.data.name === "MetablocksReceiptNft"
    )
  );

  return (
    <MetadataList
      title="Deposited in Universe"
      metadataFromMint={inContractMetadata}
    />
  );
};

const Page = () => {
  const wallet = useWallet();
  const { connection } = useConnection();

  return (
    <div className="flex">
      <div className="w-2/5">
        <ViewNfts />
      </div>
      <div className="w-2/5">
        <ViewNftsInUniverse />
      </div>

      <div className="w-1/5">
        <MetaNft />
      </div>
    </div>
  );
};

export default Page;
