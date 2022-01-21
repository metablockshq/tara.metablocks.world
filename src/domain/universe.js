import { Program, Provider, utils, web3 } from '@project-serum/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { defAtom } from '@thi.ng/atom'
import useSWR from 'swr'

import {
  findUniverseAddress,
  getMetaBlocksProgram,
} from '../utils/solana'

import networkState from './network'

const state = defAtom({})

const createUniverse = async (
  wallet,
  name,
  description,
  websiteUrl,
) => {
  const program = getMetaBlocksProgram(wallet)
  try {
    state.swap((current) => ({
      ...current,
      creatingUniverse: true,
      createUniverseError: null,
    }))

    const [universeKey, bump] = await findUniverseAddress(
      wallet.publicKey,
    )

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
          systemProgram: web3.SystemProgram.programId,
        },
        signers: [],
      },
    )

    const universeData = await program.account.universe.fetch(
      universeKey,
    )
    state.swap((current) => ({
      ...current,
      createdUniverseData: universeData,
    }))
  } catch (error) {
    console.log(error)
    state.swap((current) => ({
      ...current,
      createUniverseError: error,
    }))
  } finally {
    state.swap((current) => ({
      ...current,
      creatingUniverse: false,
    }))
  }
}

// TODO: convert this to useResource hook
const useUniverses = (network) => {
  return useSWR(network.universeIndexUrl)
}

// TODO: convert this to useResource hook
const useLastCrawledTime = (network) => {
  return useSWR(network.universeLastCrawledUrl)
}

// TODO: convert this to useResource hook
const universeByPublicKey = (universes, publicKey) => {
  return universes.find((u) => u.publicKey === publicKey)
}

const depositNFT = async (wallet, metadata) => {
  // deposit one at a time?
  state.resetIn('depositingNFT', true)
  /* await program.rpc.depositNft(
   *   nftWrapper.userNftBump,
   *   nftWrapper.vaultBump,
   *   nftWrapper.vaultAssociatedBump,
   *   new anchor.BN(index),
   *   {
   *     accounts: {
   *       userNft: nftWrapper.userNftAccountKey,
   *       vaultAuthority: nftWrapper.vaultAccountKey,
   *       authority: fakeUserAuthority.publicKey,
   *       universe: nftWrapper.universeAccountKey,
   *       userAssociatedNft: nftWrapper.userAssociatedAccount,
   *       vaultAssociatedNft: nftWrapper.vaultAssociatedAccount,
   *       tokenMint: nftWrapper.mintKey,
   *       payer: fakeUserAuthority.publicKey,
   *       tokenProgram: TOKEN_PROGRAM_ID,
   *       associatedTokenProgram: ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
   *       systemProgram: anchor.web3.SystemProgram.programId,
   *       rent: anchor.web3.SYSVAR_RENT_PUBKEY,
   *     },
   *     signers: [fakeUserAuthority],
   *   },
   * ) */
}

export default state
export {
  createUniverse,
  useUniverses,
  useLastCrawledTime,
  universeByPublicKey,
}
