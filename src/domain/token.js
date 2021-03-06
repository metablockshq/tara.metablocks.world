import { defAtom } from "@thi.ng/atom";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from "@solana/web3.js";
import axios from "axios";
import { publicKeys } from "~/config";

const state = defAtom({
  parsedProgramAccounts: [],
  metadataFromMint: {},
});
export default state;

const getParsedProgramAccounts = (conn, wallet) => {
  state.resetIn("gettingParsedProgramAccounts", true);
  conn
    .getParsedProgramAccounts(new PublicKey(publicKeys.spl), {
      filters: [
        {
          // why 165?
          dataSize: 165, // number of bytes
        },
        {
          memcmp: {
            // why 32?
            offset: 32, // number of bytes
            bytes: wallet.publicKey.toString(),
          },
        },
      ],
    })
    .then((pa) => {
      state.swap((s) => ({
        ...s,
        getParsedProgramAccountsError: null,
        parsedProgramAccounts: pa,
      }));
    })
    .catch((err) => state.resetIn("getParsedProgramAccountsError", err))
    .finally(() => {
      state.resetIn("gettingParsedProgramAccounts", false);
    });
};

// given a list of parsed program accounts,
// return the accounts where num tokens is more than 0
const filterEmptyProgramAccounts = (parsedProgramAccounts) => {
  return parsedProgramAccounts.filter(
    (pa) => pa.account.data.parsed.info.tokenAmount.uiAmount > 0
  );
};

const getBalance = (conn, wallet) => {
  state.resetIn("gettingBalance", true);

  conn
    .getBalance(wallet.publicKey)
    .then((balance) =>
      state.swap({
        balance,
        getBalanceError: null,
      })
    )
    .catch((err) => state.resetIn("getBalanceError", err))
    .finally(() => state.resetIn("gettingBalance", false));
};

const getMetadataFromMint = (conn, mint) => {
  state.resetIn(`gettingMetadataFromMint.${mint}`, true);

  Metadata.getPDA(new PublicKey(mint))
    .then((metadataPDA) => {
      Metadata.load(conn, metadataPDA)
        .then((metadata) => {
          state.resetIn(`metadataFromMint.${mint}`, metadata);
        })
        .catch((err) => state.resetIn(`getMetadataFromMintError.${mint}`, err))
        .finally(() => {
          state.resetIn(`gettingMetadataFromMint.${mint}`, false);
        });
    })
    .catch((err) => {
      state.swap((s) => ({
        ...s,
        [`getMetadataFromMintError.${mint}`]: err,
        [`gettingMetadataFromMint.${mint}`]: false,
      }));
    });
};

const RECEIPT_URL =
  "https://ctvymyaq3e.execute-api.ap-south-1.amazonaws.com/Prod/receipt-shortener";

const getShortenedReceiptUrl = async ({
  arweaveUrl,
  universeAddress,
  walletAddress,
}) => {
  try {
    const data = {
      universeAddress: universeAddress,
      walletAddress: walletAddress,
      arweaveUrl: arweaveUrl,
    };

    console.log(data);

    const result = await axios.post(RECEIPT_URL, data, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return result.data;
  } catch (err) {
    throw err;
  }
};

const getMetaNftShortId = async ({
  arweaveUrl,
  universeAddress,
  walletAddress,
}) => {
  try {
    const data = {
      universeAddress: universeAddress,
      walletAddress: walletAddress,
      metaNftUrl: arweaveUrl,
    };

    const result = await axios.post(RECEIPT_URL, data, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return result.data;
  } catch (err) {
    throw err;
  }
};

export {
  getParsedProgramAccounts,
  getBalance,
  filterEmptyProgramAccounts,
  getMetadataFromMint,
  getShortenedReceiptUrl,
  getMetaNftShortId,
};
