import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { ChaintrixSolana } from "../target/types/chaintrix_solana";
import { PublicKey } from '@solana/web3.js';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import { acceptBetsTest, closeBet, closeGame, playerCanBet } from "./methods";
import { PLAYER_INITIAL_SOL } from "./constants";

describe("chaintrix-solana", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ChaintrixSolana as Program<ChaintrixSolana>;
  const provider = program.provider;
  const localWallet = anchor.Wallet.local();
  const connection = provider.connection;
  const player0 = anchor.web3.Keypair.generate();
  const player1 = anchor.web3.Keypair.generate();
  const treasuryWallet = anchor.web3.Keypair.fromSeed(Buffer.from(Array(32).fill(0)));
  console.log(treasuryWallet.publicKey.toBase58())
  let betAccount0PDA: PublicKey = null
  let betAccount0PDABump: number = 0
  let betAccount1PDA: PublicKey = null
  let betAccount1PDABump: number = 0
  let acceptedBetsPDA: PublicKey = null
  let acceptedBetsPDABump: number = 0
  const correctArweave = 'wunAPEbsdwrPe4Lf4V_kC10OGDsgFS-A9WROmeCLHcA';
  const wrongArweave = 'wrong'

  /** ---------------------------------------------------
   * TEST ALL FUNCTIONS WITH CORRECT AND WRONG PARAMETERS
   * ------------------------------------------------- */

  it("Fund necessary wallets", async () => {
    var fromAirDropSignature = await connection.requestAirdrop(
      player0.publicKey,
      PLAYER_INITIAL_SOL,
    );
    await connection.confirmTransaction(fromAirDropSignature);
    var fromAirDropSignature = await connection.requestAirdrop(
      player1.publicKey,
      PLAYER_INITIAL_SOL,
    );
    await connection.confirmTransaction(fromAirDropSignature);
    var fromAirDropSignature = await connection.requestAirdrop(
      // provider.wallet.publicKey,
      localWallet.publicKey,
      PLAYER_INITIAL_SOL,
    );
    await connection.confirmTransaction(fromAirDropSignature);
  })

  it("Player 0 can bet", async () => {
    [betAccount0PDA, betAccount0PDABump] = await playerCanBet(program, player0);
  })

  it("Random account CANNOT close bet", async () => {
    await expect(closeBet(
      program, player1, betAccount0PDA, player0.publicKey
    )).to.be.rejectedWith('An address constraint was violated')
  })

  it("Server CANNOT close bet with wrong params", async () => {
    // the account saved in the bet account is not the same as the player public key
    await expect(closeBet(
      program, localWallet.payer, betAccount0PDA, player1.publicKey
    )).to.be.rejectedWith('Error Code: WrongAccounts')
  })

  it("Server CAN close bet", async () => {
    await closeBet(
      program, localWallet.payer, betAccount0PDA, player0.publicKey
    );
    [betAccount0PDA, betAccount0PDABump] = await playerCanBet(program, player0);
  })

  it("Player 1 can bet", async () => {
    [betAccount1PDA, betAccount1PDABump] = await playerCanBet(program, player1);
  })

  it("Random account CANNOT accept bets", async () => {
    await expect(acceptBetsTest(
      program, player0, betAccount0PDA, betAccount1PDA,
      player0.publicKey, player1.publicKey
    )).to.be.rejectedWith('An address constraint was violated')
  })

  it("Server CANNOT accept wrong bets", async () => {
    // account 0 and account 1 are the same
    await expect(acceptBetsTest(
      program, localWallet.payer, betAccount0PDA, betAccount0PDA,
      player0.publicKey, player1.publicKey
    )).to.be.rejectedWith('sum of account balances before and after instruction do not match')
  })

  it("Server CAN accept bets", async () => {
    acceptedBetsPDA = await acceptBetsTest(
      program, localWallet.payer, betAccount0PDA, betAccount1PDA,
      player0.publicKey, player1.publicKey
    )
  })

  it("Server CANNOT accept bets that were already accepted", async () => {
    await expect(acceptBetsTest(
      program, localWallet.payer, betAccount0PDA, betAccount1PDA,
      player0.publicKey, player1.publicKey
    )).to.be.rejectedWith('Error Code: AccountNotInitialized')
  })

  it("Random account CANNOT close game", async () => {
    await expect(closeGame(
      program, player0, acceptedBetsPDA,
      treasuryWallet.publicKey, player0.publicKey, player1.publicKey,
      correctArweave, 1
    )).to.be.rejectedWith('An address constraint was violated')
  })

  it("Server CANNOT close the game with wrong parameters", async () => {
    // arweave id incorrect size
    await expect(closeGame(
      program, localWallet.payer, acceptedBetsPDA,
      treasuryWallet.publicKey, player0.publicKey, player1.publicKey,
      wrongArweave, 1
    )).to.be.rejectedWith('Arweave ID must have 43 chars.')

    // wrong winner index
    await expect(closeGame(
      program, localWallet.payer, acceptedBetsPDA,
      treasuryWallet.publicKey, player0.publicKey, player1.publicKey,
      correctArweave, 100
    )).to.be.rejectedWith('Wrong parameters')
  })

  it("Server can close game", async () => {
    const winnerIndex = 0
    await closeGame(
      program, localWallet.payer, acceptedBetsPDA,
      treasuryWallet.publicKey, player0.publicKey, player1.publicKey,
      correctArweave, winnerIndex
    )
  })

  it("Server CANNOT close the game after it was closed", async () => {
    await expect(closeGame(
      program, localWallet.payer, acceptedBetsPDA,
      treasuryWallet.publicKey, player0.publicKey, player1.publicKey,
      correctArweave, 1
    )).to.be.rejectedWith('Error Code: AccountNotInitialized')
  })

  /** ---------------------------------------------------
   * TEST DRAW
   * ------------------------------------------------- */
  it("Draw scenario", async () => {
    [betAccount0PDA, betAccount0PDABump] = await playerCanBet(program, player0);
    [betAccount1PDA, betAccount1PDABump] = await playerCanBet(program, player1);
    acceptedBetsPDA = await acceptBetsTest(
      program, localWallet.payer, betAccount0PDA, betAccount1PDA,
      player0.publicKey, player1.publicKey
    )
    const winnerIndex = 255
    await closeGame(
      program, localWallet.payer, acceptedBetsPDA,
      treasuryWallet.publicKey, player0.publicKey, player1.publicKey,
      correctArweave, winnerIndex
    )
  })
});
