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
  const res = await api.getUserNfts(
    { wallet, connection },
    {
      universes: [], // Any universe address
      vaultAuthorities: [],
      authorities: [],
    }
  );
};

const depositNft = async ({ wallet, connection, metadata }) => {
  const taraUniverseKey = new PublicKey(
    "56AfWAaYWxKwLY4HbaanCjre6K8zvtLYy5v2465Wy3dd"
  );
  const mintKey = new PublicKey(metadata?.data?.mint);
  const url = metadata?.data?.data?.uri; // arweave URL
  const isReceiptMasterEdition = false; // users should not be able to create copies of receipt

  console.log({
    wallet,
    connection,
    mintKey,
    url,
    isReceiptMasterEdition,
    universeKey: taraUniverseKey,
  });
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

    console.log("---> deposit res", res);
  } catch (err) {
    console.log("depositNftError", err);
  } finally {
    state.resetIn("depositingNft", false);
  }
};

export default state;
export {
  depositNft,
  useUniverses,
  useLastCrawledTime,
  universeByPublicKey,
  getUserNfts,
};
