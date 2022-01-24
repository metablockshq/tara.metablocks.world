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

  const { mint, updateAuthority } = metadata.data;
  const mintKey = new PublicKey(mint);
  const updateAuthorityKey = new PublicKey(updateAuthority);

  // userNftKey is the wrapper account for the vault where the NFT is stored rn
  // bump is needed for validation
  const [userNftKey, userNftBump] = await findUserNftAddress(
    wallet.publicKey,
    mintKey
  );

  // const universeKey = account of the universe in question
  const universeKey = new PublicKey(
    "6oupeGxPUSRL6V7cHejqoco2w49ZBHaq4pzVthCiyYkq"
  );

  // vaultKey is the owner of the vaultAssociatedAccount
  const [vaultKey, vaultBump] = await findVaultAddress(
    universeKey,
    wallet.publicKey,
    mintKey
  );

  // vaultAssociatedKey is the public key of the (escrow) account that actually stores the nft
  const [vaultAssociatedKey, vaultAssociatedBump] =
    await findAssociatedAddressForKey(vaultKey, mintKey);

  //
  const [userAssociatedNftKey, _] = await PublicKey.findProgramAddress(
    [
      wallet.publicKey.toBuffer(),
      new PublicKey(programIds.spl).toBuffer(),
      mintKey.toBuffer(),
    ],
    new PublicKey(programIds.associatedToken)
  );

  const program = getMetaBlocksProgram(wallet);

  console.log({
    userNftKey: userNftKey.toString(),
    userNftBump,
    vaultKey: vaultKey.toString(),
    vaultBump,
    vaultAssociatedKey: vaultAssociatedKey.toString(),
    vaultAssociatedBump,
    mint,
    userAssociatedNft: userAssociatedNftKey.toString(),
    universeKey: universeKey.toString(),
  });

  program.rpc
    .depositNft(userNftBump, vaultBump, vaultAssociatedBump, {
      accounts: {
        userNft: userNftKey,
        vaultAuthority: vaultKey,
        authority: wallet.publicKey,
        universe: universeKey,
        userAssociatedNft: userAssociatedNftKey,
        vaultAssociatedNft: vaultAssociatedKey,
        tokenMint: mintKey,
        payer: wallet.publicKey,
        tokenProgram: new PublicKey(programIds.spl),
        associatedTokenProgram: new PublicKey(programIds.associatedToken),
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
      signers: [wallet.payer],
    })
    .then(console.log)
    .catch((err) => {
      console.log("depositNftError", err);
    })
    .finally(() => {
      console.log("reset depositingNft");
      state.resetIn("depositingNft", false);
    });
};

export default state;
export {
  createUniverse,
  depositNft,
  useUniverses,
  useLastCrawledTime,
  universeByPublicKey,
};
