import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { defAtom } from "@thi.ng/atom";
import useSWR from "swr";
import { programIds } from "../config";
import {
  findAssociatedAddressForKey,
  findUniverseAddress,
  findUserNftAddress,
  findVaultAddress,
  getMetaBlocksProgram,
} from "../utils/solana";

const state = defAtom({});

const createUniverse = async (wallet, name, description, websiteUrl) => {
  const program = getMetaBlocksProgram(wallet);
  try {
    state.swap((current) => ({
      ...current,
      creatingUniverse: true,
      createUniverseError: null,
    }));

    const [universeKey, bump] = await findUniverseAddress(wallet.publicKey);

    const tx = await program.rpc.createUniverse(
      bump,
      name,
      description,
      websiteUrl,
      {
        accounts: {
          universe: universeKey,
          payer: wallet.publicKey,
          universeAuthority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [],
      }
    );

    const universeData = await program.account.universe.fetch(universeKey);
    state.swap((current) => ({
      ...current,
      createdUniverseData: universeData,
    }));
  } catch (error) {
    console.log(error);
    state.swap((current) => ({
      ...current,
      createUniverseError: error,
    }));
  } finally {
    state.swap((current) => ({
      ...current,
      creatingUniverse: false,
    }));
  }
};

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

const depositNft = async (wallet, metadata) => {
  // TODO: deposit one at a time?
  state.resetIn("depositingNft", true);

  const { mint } = metadata.data;
  const mintKey = new PublicKey(mint);

  // const universeKey = account of the universe in question
  const universeKey = new PublicKey(
    "6oupeGxPUSRL6V7cHejqoco2w49ZBHaq4pzVthCiyYkq"
  );

  const { userNftBump, vaultBump, vaultAssociatedBump, depositAccounts } =
    await computeMetaBlocksDepositParams(
      wallet.publicKey,
      mintKey,
      universeKey
    );

  const program = getMetaBlocksProgram(wallet);

  try {
    const tx = await program.rpc.depositNft(
      userNftBump,
      vaultBump,
      vaultAssociatedBump,
      {
        accounts: depositAccounts,
        signers: [wallet.payer],
      }
    );

    console.log(tx);
  } catch (err) {
    console.log("depositNftError", err);
  } finally {
    state.resetIn("depositingNft", false);
  }
};

export default state;
export {
  createUniverse,
  depositNft,
  useUniverses,
  useLastCrawledTime,
  universeByPublicKey,
};
