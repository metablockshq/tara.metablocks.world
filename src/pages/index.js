import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@kyra/solana/hooks";
import { Intent, Button, ProgressBar, Tag } from "@blueprintjs/core";

import { useAtom, useResource } from "@kyra/hooks";
import { scale } from "@kyra/utils/number";

import tokenState, {
  getMetadataFromMint,
  getParsedProgramAccounts,
  filterEmptyProgramAccounts,
} from "~/domain/token";

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

function MetadataCardContent({ data }) {
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
    </div>
  );
}

function MetadataCardLoading() {
  return <div className="h-32 rounded bg-slate-100" />;
}

const MetadataCard = ({ metadata }) => {
  const { name, uri } = metadata.data.data;
  const { data, error, isLoading } = useResource(uri);
  return (
    <div className="overflow-hidden relative bg-white shadow-lg ring-1 ring-black/5 rounded-xl flex items-center gap-6">
      {!isLoading && !error && (
        <img
          className="absolute -left-6 w-24 h-24 rounded-full shadow-lg"
          src={data.image}
        />
      )}

      <div class="flex flex-col py-5 pr-4 pl-24">
        <strong class="text-slate-900 text-sm font-medium">{name}</strong>
        <span class="text-slate-500 text-sm font-medium">
          {!isLoading && <MetadataCardContent data={data} />}
          {isLoading && <MetadataCardLoading />}
        </span>
      </div>
    </div>
  );
};

const MetadataList = ({ metadataFromMint }) => {
  return (
    <div className="mt-8 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.keys(metadataFromMint).map((mint) => {
        return <MetadataCard key={mint} metadata={metadataFromMint[mint]} />;
      })}
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

  useEffect(() => {
    if (wallet && wallet.publicKey)
      getParsedProgramAccounts(connection, wallet);
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
          <MetadataList metadataFromMint={metadataFromMint} />
        </div>
      )}
    </div>
  );
};

export default ViewNfts;
