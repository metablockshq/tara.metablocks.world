import { Program, Provider, utils } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { programIds } from "../config";
import idl from "./meta_blocks.json";

const programId = new PublicKey(idl.metadata.address);

const opts = {
  preflightCommitment: "processed",
};

const getProvider = (conn, wallet) => {
  return new Provider(conn, wallet, opts.preflightCommitment);
};

const getMetaBlocksProgram = (wallet) => {
  const provider = getProvider(wallet);
  const program = new Program(idl, programId, provider);
  return program;
};

// Utils from pl, need to package these

const findUniverseAddress = async (universeAuthority) => {
  return await PublicKey.findProgramAddress(
    [
      Buffer.from(utils.bytes.utf8.encode("Universe")),
      universeAuthority.toBytes(),
    ],
    new PublicKey(programIds.metaBlocks)
  );
};

const findUserNftAddress = async (userAuthority, mintKey) => {
  return await PublicKey.findProgramAddress(
    [
      Buffer.from(utils.bytes.utf8.encode("UserNft")),
      userAuthority.toBuffer(),
      mintKey.toBuffer(),
    ],
    new PublicKey(programIds.metaBlocks)
  );
};

const findVaultAddress = async (universeKey, usersKey, mintKey) => {
  return await PublicKey.findProgramAddress(
    [
      Buffer.from(utils.bytes.utf8.encode("VaultMetaBlocks")),
      universeKey.toBuffer(),
      usersKey.toBuffer(),
      mintKey.toBuffer(),
    ],
    new PublicKey(programIds.metaBlocks)
  );
};

const findAssociatedAddressForKey = async (tokenRecipient, mintKey) => {
  return await PublicKey.findProgramAddress(
    [
      tokenRecipient.toBuffer(),
      new PublicKey(programIds.spl).toBuffer(),
      mintKey.toBuffer(),
    ],
    new PublicKey(programIds.associatedToken)
  );
};

export {
  findUniverseAddress,
  findUserNftAddress,
  findVaultAddress,
  findAssociatedAddressForKey,
  getConnection,
  getProvider,
  getMetaBlocksProgram,
};
