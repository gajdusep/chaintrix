import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { ChaintrixSolana } from "../target/types/chaintrix_solana";
import * as assert from "assert";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { PublicKey, SystemProgram, Transaction, Connection, Commitment, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bigInt, { BigInteger } from "big-integer";
import { randomBytes } from 'crypto';

const BET_ACCOUNT_SIZE = 41
const ACCEPTED_BETS_ACCOUNT_SIZE = 73
const BET_AMOUNT = LAMPORTS_PER_SOL / 10;
const PLAYER_INITIAL_SOL = LAMPORTS_PER_SOL;

const playerCanBet = async (program: Program<ChaintrixSolana>, player: anchor.web3.Keypair): Promise<[typeof betAccountPDA, typeof betAccountPDABump]> => {
  const connection = program.provider.connection;
  const seed = randomBytes(32);

  const [betAccountPDA, betAccountPDABump] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("seed"), seed],
    program.programId
  );
  console.log(`bet accounts: ${betAccountPDA} ${betAccountPDABump}`)

  const tx = await program.methods.bet(betAccountPDABump, seed)
    .accounts({
      baseAccount: betAccountPDA,
      player: player.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([player])
    .rpc({ commitment: 'confirmed' });


  let playerBalance = await connection.getBalance(player.publicKey)
  let PDAbalance = await connection.getBalance(betAccountPDA);
  console.log(`PDA balance: ${PDAbalance}`)

  const pdaAccount = await program.account.betAccount.fetch(betAccountPDA);
  assert.equal(pdaAccount.bump, betAccountPDABump);
  assert.equal(pdaAccount.player.toBase58(), player.publicKey.toBase58())

  const minRent = await connection.getMinimumBalanceForRentExemption(BET_ACCOUNT_SIZE)
  assert.equal(PDAbalance, BET_AMOUNT + minRent)
  assert.equal(playerBalance, PLAYER_INITIAL_SOL - BET_AMOUNT - minRent)

  return [betAccountPDA, betAccountPDABump]
}

const printAccountBalance = async (connection: Connection, publicKey: PublicKey) => {
  let balance = await connection.getBalance(publicKey);
  console.log(`${publicKey}: ${balance}`)
}

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

  it("Player 1 can bet", async () => {
    [betAccount1PDA, betAccount1PDABump] = await playerCanBet(program, player1);
  })

  it("Server CAN accept bets", async () => {
    const seed = randomBytes(32);
    const [_acceptedBetsPDA, _acceptedBetsPDABump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("accepted"), seed],
      program.programId
    );
    acceptedBetsPDA = _acceptedBetsPDA
    acceptedBetsPDABump = _acceptedBetsPDABump

    let transactionFee = 0;
    const serverBalanceBeforeTx = await connection.getBalance(localWallet.publicKey);
    // console.log(serverBalanceBeforeTx)
    try {
      const tx = await program.methods.acceptBets(acceptedBetsPDABump, seed)
        .accounts({
          acceptedBetsAccount: acceptedBetsPDA,
          player0BetAccount: betAccount0PDA,
          player1BetAccount: betAccount1PDA,
          server: localWallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([])
        .rpc({ commitment: 'confirmed' })

      transactionFee = (await connection.getParsedTransaction(tx, 'confirmed')).meta.fee;
    } catch (e) {
      console.log(e)
    }
    let serverBalanceAfterTx = await connection.getBalance(localWallet.publicKey);
    assert.equal(bigInt(serverBalanceBeforeTx.toString()).minus(bigInt(serverBalanceAfterTx.toString())).toJSNumber(), transactionFee)
    console.log(LAMPORTS_PER_SOL / transactionFee)

    const pdaAccount = await program.account.acceptedBetsAccount.fetch(acceptedBetsPDA);
    assert.equal(pdaAccount.player0.toBase58(), player0.publicKey.toBase58())
    assert.equal(pdaAccount.player1.toBase58(), player1.publicKey.toBase58())

    let PDAbalance = await connection.getBalance(acceptedBetsPDA);

    const minRent = await connection.getMinimumBalanceForRentExemption(ACCEPTED_BETS_ACCOUNT_SIZE)
    const betMinRent = await connection.getMinimumBalanceForRentExemption(BET_ACCOUNT_SIZE)
    console.log(`hmm: ${betMinRent}`)
    assert.equal(PDAbalance, 2 * BET_AMOUNT + 2 * betMinRent)
  })

  it("Winner 0 won", async () => {
    const seed = randomBytes(32);
    const [closedGamePDA, closedGamePDABump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("closed"), seed],
      program.programId
    );

    let transactionFee = 0;
    await printAccountBalance(connection, localWallet.publicKey);
    try {
      const tx = await program.methods.closeGameWithWinner(closedGamePDABump, seed, 1)
        .accounts({
          acceptedBetsAccount: acceptedBetsPDA,
          player0: player0.publicKey,
          player1: player1.publicKey,
          server: localWallet.publicKey,
          gameClosedAccount: closedGamePDA,
          treasury: treasuryWallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([])
        .rpc({ commitment: 'confirmed' })

      transactionFee = (await connection.getParsedTransaction(tx, 'confirmed')).meta.fee;
    } catch (e) {
      console.log(e)
    }
    await printAccountBalance(connection, localWallet.publicKey);

    // TODO: calculate how much should the winner have
    await printAccountBalance(connection, player0.publicKey);
    await printAccountBalance(connection, player1.publicKey);
    // let serverBalanceAfterTx = await connection.getBalance(player0.publicKey);
  })

});
