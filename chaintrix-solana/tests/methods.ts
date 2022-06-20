import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { ChaintrixSolana } from "../target/types/chaintrix_solana";
import * as assert from "assert";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { PublicKey, SystemProgram, Transaction, Connection, Commitment, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bigInt, { BigInteger } from "big-integer";
import { randomBytes } from 'crypto';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ACCEPTED_BETS_ACCOUNT_SIZE, BET_ACCOUNT_SIZE, BET_AMOUNT, TREASURY_AMOUNT } from "./constants";
chai.use(chaiAsPromised);

export const printAccountBalance = async (connection: Connection, publicKey: PublicKey) => {
    let balance = await connection.getBalance(publicKey);
    console.log(`${publicKey}: ${balance}`)
}

const assertBeforeAfterDiff = (before: number, after: number, expectedDiff: number) => {
    assert.equal(bigInt(after.toString()).minus(bigInt(before.toString())).toJSNumber(), expectedDiff)
}

export const playerCanBet = async (
    program: Program<ChaintrixSolana>,
    player: anchor.web3.Keypair
): Promise<[typeof betAccountPDA, typeof betAccountPDABump]> => {
    const connection = program.provider.connection;
    const seed = randomBytes(32);

    const playerBalanceBeforeTx = await connection.getBalance(player.publicKey);

    const [betAccountPDA, betAccountPDABump] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("seed"), seed],
        program.programId
    );
    console.log(`bet accounts: ${betAccountPDA} ${betAccountPDABump}`)

    const tx = await program.methods.bet(betAccountPDABump, seed)
        .accounts({
            betAccount: betAccountPDA,
            player: player.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc({ commitment: 'confirmed' });

    const minRent = await connection.getMinimumBalanceForRentExemption(BET_ACCOUNT_SIZE)

    // bet account balance and data
    let PDAbalance = await connection.getBalance(betAccountPDA);
    const pdaAccount = await program.account.betAccount.fetch(betAccountPDA);
    assert.equal(pdaAccount.bump, betAccountPDABump);
    assert.equal(pdaAccount.player.toBase58(), player.publicKey.toBase58())
    assert.equal(PDAbalance, BET_AMOUNT + minRent)

    // player balance
    const playerBalanceAfterTx = await connection.getBalance(player.publicKey);
    assertBeforeAfterDiff(playerBalanceBeforeTx, playerBalanceAfterTx, - (BET_AMOUNT + minRent))

    return [betAccountPDA, betAccountPDABump]
}

export const closeBet = async (
    program: Program<ChaintrixSolana>,
    signerKeyPair: anchor.web3.Keypair,
    betAccountPDA: PublicKey,
    player: PublicKey,
) => {
    const connection = program.provider.connection;
    const playerBalanceBeforeTx = await connection.getBalance(player);
    const betAccountBalance = await connection.getBalance(betAccountPDA);

    const tx = await program.methods.closeBetWithoutPlaying()
        .accounts({
            betAccount: betAccountPDA,
            player: player,
            server: signerKeyPair.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([signerKeyPair])
        .rpc({ commitment: 'confirmed' })

    let playerBalanceAfterTx = await connection.getBalance(player);
    assertBeforeAfterDiff(playerBalanceBeforeTx, playerBalanceAfterTx, betAccountBalance)
}

export const acceptBetsTest = async (
    program: Program<ChaintrixSolana>,
    signerKeyPair: anchor.web3.Keypair,
    betAccount0PDA: PublicKey,
    betAccount1PDA: PublicKey,
    player0: PublicKey,
    player1: PublicKey
): Promise<PublicKey> => {
    const connection = program.provider.connection;

    const seed = randomBytes(32);
    const [acceptedBetsPDA, acceptedBetsPDABump] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("accepted"), seed],
        program.programId
    );

    let transactionFee = 0;
    const signerBalanceBeforeTx = await connection.getBalance(signerKeyPair.publicKey);

    const tx = await program.methods.acceptBets(acceptedBetsPDABump, seed)
        .accounts({
            acceptedBetsAccount: acceptedBetsPDA,
            player0BetAccount: betAccount0PDA,
            player1BetAccount: betAccount1PDA,
            server: signerKeyPair.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([signerKeyPair])
        .rpc({ commitment: 'confirmed' })

    transactionFee = (await connection.getParsedTransaction(tx, 'confirmed')).meta.fee;

    let signerBalanceAfterTx = await connection.getBalance(signerKeyPair.publicKey);
    assertBeforeAfterDiff(signerBalanceBeforeTx, signerBalanceAfterTx, -transactionFee)
    console.log(LAMPORTS_PER_SOL / transactionFee)

    const pdaAccount = await program.account.acceptedBetsAccount.fetch(acceptedBetsPDA);
    assert.equal(pdaAccount.player0.toBase58(), player0.toBase58())
    assert.equal(pdaAccount.player1.toBase58(), player1.toBase58())

    let PDAbalance = await connection.getBalance(acceptedBetsPDA);

    const minRent = await connection.getMinimumBalanceForRentExemption(ACCEPTED_BETS_ACCOUNT_SIZE)
    const betMinRent = await connection.getMinimumBalanceForRentExemption(BET_ACCOUNT_SIZE)
    // console.log(`hmm: ${betMinRent}`)
    assert.equal(PDAbalance, 2 * BET_AMOUNT + 2 * betMinRent)

    return acceptedBetsPDA
}

export const closeGame = async (
    program: Program<ChaintrixSolana>,
    signerKeyPair: anchor.web3.Keypair,
    acceptedBetsPDA: PublicKey,
    treasury: PublicKey,
    player0: PublicKey,
    player1: PublicKey,
    arweaveId: string,
    winnerIndex: number
) => {
    const connection = program.provider.connection;

    const player0BalanceBeforeTx = await connection.getBalance(player0);
    const player1BalanceBeforeTx = await connection.getBalance(player1);
    const treasuryBalanceBeforeTx = await connection.getBalance(treasury);
    const accepteedAccountBalance = await connection.getBalance(acceptedBetsPDA);

    const seed = randomBytes(32);
    const [closedGamePDA, closedGamePDABump] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("closed"), seed],
        program.programId
    );

    let transactionFee = 0;
    await printAccountBalance(connection, signerKeyPair.publicKey);

    const tx = await program.methods.closeGameWithWinner(closedGamePDABump, seed, winnerIndex, arweaveId)
        .accounts({
            acceptedBetsAccount: acceptedBetsPDA,
            player0: player0,
            player1: player1,
            server: signerKeyPair.publicKey,
            gameClosedAccount: closedGamePDA,
            treasury: treasury,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([signerKeyPair])
        .rpc({ commitment: 'confirmed' })

    transactionFee = (await connection.getParsedTransaction(tx, 'confirmed')).meta.fee;

    const pdaAccount = await program.account.gameClosedAccount.fetch(closedGamePDA);
    assert.equal(pdaAccount.player0.toBase58(), player0.toBase58())
    assert.equal(pdaAccount.player1.toBase58(), player1.toBase58())
    assert.equal(pdaAccount.winnerIndex, winnerIndex)

    const player0BalanceAfterTx = await connection.getBalance(player0);
    const player1BalanceAfterTx = await connection.getBalance(player1);
    const treasuryBalanceAfterTx = await connection.getBalance(treasury);
    if (winnerIndex == 0) {
        assertBeforeAfterDiff(player0BalanceBeforeTx, player0BalanceAfterTx, accepteedAccountBalance - TREASURY_AMOUNT)
        assertBeforeAfterDiff(player1BalanceBeforeTx, player1BalanceAfterTx, 0)
        assertBeforeAfterDiff(treasuryBalanceBeforeTx, treasuryBalanceAfterTx, TREASURY_AMOUNT)
    }
    else if (winnerIndex == 1) {
        assertBeforeAfterDiff(player0BalanceBeforeTx, player0BalanceAfterTx, 0)
        assertBeforeAfterDiff(player1BalanceBeforeTx, player1BalanceAfterTx, accepteedAccountBalance - TREASURY_AMOUNT)
        assertBeforeAfterDiff(treasuryBalanceBeforeTx, treasuryBalanceAfterTx, TREASURY_AMOUNT)

    } else if (winnerIndex == 255) {
        assertBeforeAfterDiff(player0BalanceBeforeTx, player0BalanceAfterTx, accepteedAccountBalance / 2)
        assertBeforeAfterDiff(player1BalanceBeforeTx, player1BalanceAfterTx, accepteedAccountBalance / 2)
        assertBeforeAfterDiff(treasuryBalanceBeforeTx, treasuryBalanceAfterTx, 0)
    }

    await printAccountBalance(connection, signerKeyPair.publicKey);

    // TODO: calculate how much should the winner have
    await printAccountBalance(connection, player0);
    await printAccountBalance(connection, player1);
    // let serverBalanceAfterTx = await connection.getBalance(player0.publicKey);
}
