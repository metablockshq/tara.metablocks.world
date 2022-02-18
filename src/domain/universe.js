import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { defAtom } from "@thi.ng/atom";
import useSWR from "swr";
import { api } from "@kyraa/metablocks";

import { programIds } from "../config";

const state = defAtom({ depositedNfts: [] });

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

const taraUniverseKey = new PublicKey(
  "56AfWAaYWxKwLY4HbaanCjre6K8zvtLYy5v2465Wy3dd"
);

const getUserNfts = async ({ wallet, connection, filter }) => {
  const res = await api.getWrappedUserNftAccounts(
    { wallet, connection },
    {
      // universes: [taraUniverseKey.toString()], // Any universe address
      universes: [], // Any universe address
      vaultAuthorities: [],
      // authorities: [wallet?.publicKey?.toString()],
      authorities: [],
    }
  );
  return res;
};

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

  try {
    state.resetIn("withdrawingNft", true);
    const res = await api.withdrawNftWithReceipt({
      wallet,
      connection,
      receiptMint,
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

const fetchDepositedNfts = async ({ wallet, connection }) => {
  state.resetIn("fetchingDepositedNfts", true);
  try {
    const walletKeyStr = wallet?.publicKey?.toString();
    const universeKeyStr = taraUniverseKey.toString();
    const nfts = await getUserNfts({ wallet, connection, filter: {} });
    const taraNftsOfConnectedWallet = nfts.filter(
      (n) => n.universe === universeKeyStr && n.nft_authority === walletKeyStr
    );
    state.resetIn("depositedNfts", taraNftsOfConnectedWallet);
  } catch (err) {
  } finally {
    state.resetIn("fetchingDepositedNfts", false);
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
  fetchDepositedNfts,
};
