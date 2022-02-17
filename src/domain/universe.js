import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { defAtom } from "@thi.ng/atom";
import useSWR from "swr";
import { api } from "@kyraa/metablocks";

import { programIds } from "../config";

const state = defAtom({});

// TODO: convert this to useResource hook
const useUniverses = (network) => {
  return useSWR(network.universeIndexUrl);
};

// TODO: convert this to useResource hook
const useLastCrawledTime = (network) => {
  return useSWR(network.universeLastCrawledUrl);
};

const universeByPublicKey = (universes, publicKey) => {
  return universes.find((u) => u.publicKey === publicKey);
};

const getUserNfts = async ({ wallet, connection, filter }) => {
  /* const res = await api.getUserNfts(
   *   { wallet, connection },
   *   {
   *     universes: [], // Any universe address
   *     vaultAuthorities: [],
   *     authorities: [],
   *   }
   * ); */
  return undefined;
};

const taraUniverseKey = new PublicKey(
  "56AfWAaYWxKwLY4HbaanCjre6K8zvtLYy5v2465Wy3dd"
);

const depositNft = async ({ wallet, connection, metadata }) => {
  const mintKey = new PublicKey(metadata?.data?.mint);
  const url = metadata?.data?.data?.uri; // arweave URL
  const isReceiptMasterEdition = true; // users should not be able to create copies of receipt

  try {
    state.resetIn("depositingNft", true);
    const res = await api.depositNft({
      wallet,
      connection,
      mintKey,
      url,
      isReceiptMasterEdition,
      universeKey: taraUniverseKey,
    });

    state.resetIn("depositNftRes", res);
    console.log("---> deposit res", res);
  } catch (err) {
    console.log("depositNftError", err);
  } finally {
    state.resetIn("depositingNft", false);
  }
};

const withdrawNft = async ({ wallet, connection, metadata }) => {
  const receiptMint = new PublicKey(metadata?.data?.mint);

  const tokenMint = new PublicKey(
    "8Q3izc7Qme5UoRAQqQ3cFg9rVfQHnzB4rUmYbdsWeDUR"
  );

  console.log(tokenMint);

  try {
    state.resetIn("withdrawingNft", true);
    const res = await api.withdrawNft({
      wallet,
      connection,
      tokenMint,
      universeKey: taraUniverseKey,
    });

    state.resetIn("withdrawNftRes", res);
    console.log("---> withdrawRes res", res);
  } catch (err) {
    console.log("withdrawNftError", err);
  } finally {
    state.resetIn("withdrawingNft", false);
  }
};

export default state;
export {
  depositNft,
  withdrawNft,
  useUniverses,
  useLastCrawledTime,
  universeByPublicKey,
  getUserNfts,
};
