import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SolanaPlayer, GameRoom, SolanaAcceptedBetInfo } from "../types";
import { randomBytes } from "crypto";
import { SOLANA_ENDPOINT, SOLANA_PROGRAM_ID } from "../constants";
import {
    ChaintrixSolana, IDL, PlayerWantsToPlaySolanaPayload, serializeMoves
} from 'chaintrix-game-mechanics';
// } from '../../../chaintrix-game-mechanics/dist';
import { getArweaveConfig, uploadGameMovesToArweave } from "../arweave";

const BET_ACCOUNT_SIZE = 41
const ACCEPTED_BETS_ACCOUNT_SIZE = 73
const BET_AMOUNT = LAMPORTS_PER_SOL / 10;
const PLAYER_INITIAL_SOL = LAMPORTS_PER_SOL;

const getProviderProgramWallet = () => {
    const provider = anchor.AnchorProvider.local(SOLANA_ENDPOINT);
    const program = new Program(IDL, SOLANA_PROGRAM_ID, provider);
    const localWallet = anchor.Wallet.local();
    return { provider, program, localWallet };
}

const hasPlayerBet = async (program: Program<ChaintrixSolana>, solanaPayload: PlayerWantsToPlaySolanaPayload): Promise<boolean> => {
    const connection = program.provider.connection;
    const betPDAAccount = new PublicKey(solanaPayload.betPDA)
    let PDAbalance = await connection.getBalance(betPDAAccount);

    const pdaAccount = await program.account.betAccount.fetch(betPDAAccount);

    const isPlayerCorrect = pdaAccount.player.toBase58() == solanaPayload.playerAddress
    const minRent = await connection.getMinimumBalanceForRentExemption(BET_ACCOUNT_SIZE)
    const isAccountFunded = PDAbalance == BET_AMOUNT + minRent

    console.log(`checked all things in solana: player correct: ${isPlayerCorrect}, account funded: ${isAccountFunded}`)
    return isPlayerCorrect && isAccountFunded
}

export const checkBetAccount = async (solanaPayload: PlayerWantsToPlaySolanaPayload): Promise<boolean> => {
    const { provider, program, localWallet } = getProviderProgramWallet();
    try {
        const result = await hasPlayerBet(program, solanaPayload)
        return result;
    } catch (error) {
        console.log(`Runtime error: bet account was wrong`)
        return false;
    }
}

export const closeBetWithoutPlaying = async (betAccountPDA, player,) => {
    try {
        const { provider, program, localWallet } = getProviderProgramWallet();
        const tx = await program.methods.closeBetWithoutPlaying()
            .accounts({
                betAccount: betAccountPDA,
                player: player,
                server: localWallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([])
            .rpc({ commitment: 'confirmed' })
    } catch (error) {

    }
}

/**
 * 
 * @param player0Address 
 * @param player1Address 
 * @returns null if error occurs
 */
export const acceptBetsSolana = async (player0Address, player1Address): Promise<PublicKey | null> => {
    const { provider, program, localWallet } = getProviderProgramWallet();

    const seed = randomBytes(32);
    const [acceptedBetsPDA, acceptedBetsPDABump] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("accepted"), seed],
        program.programId
    );
    console.log(`accepted bet accounts: ${acceptedBetsPDA} ${acceptedBetsPDABump}`)
    try {
        const tx = await program.methods.acceptBets(acceptedBetsPDABump, seed)
            .accounts({
                acceptedBetsAccount: acceptedBetsPDA,
                player0BetAccount: player0Address,
                player1BetAccount: player1Address,
                server: localWallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([])
            .rpc({ commitment: 'confirmed' })
    } catch (e) {
        console.log(`Failed to accept bets for ${player0Address}, ${player1Address}`);
        return null;
    }
    return acceptedBetsPDA;
}

export const solanaCloseGame = async (
    room: GameRoom, winnerIndex: number,
    serializedGameState: string
) => {
    // upload game to arweave
    const arweaveConfig = getArweaveConfig()
    let arweaveFileID = '0000000000000000000000000000000000000000000'
    try {
        arweaveFileID = await uploadGameMovesToArweave(
            arweaveConfig, Buffer.from(serializedGameState, 'utf-8')
        )
        console.log(`arweave file uploaded: ${arweaveFileID}`);
    } catch (error) {
        console.log('Arweave upload failed')
    }

    // call program - close game
    const { provider, program, localWallet } = getProviderProgramWallet();

    const seed = randomBytes(32);
    const treasuryWallet = anchor.web3.Keypair.fromSeed(Buffer.from(Array(32).fill(0)));
    console.log(`treasury: ${treasuryWallet.publicKey.toBase58()}`)
    const [closedGamePDA, closedGamePDABump] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("closed"), seed],
        program.programId
    );
    // TODO: add some checks if the room objects is alright

    const acceptedBetAccount = (room.acceptedBetInfo as SolanaAcceptedBetInfo).acceptedBetAccount
    const player0Address = (room.players[0] as SolanaPlayer).address
    const player1Address = (room.players[1] as SolanaPlayer).address

    console.log(`in solana close: ${acceptedBetAccount}, ${player0Address}, ${player1Address}, ${localWallet.publicKey.toBase58()}`)

    const tx = await program.methods.closeGameWithWinner(closedGamePDABump, seed, winnerIndex, arweaveFileID)
        .accounts({
            acceptedBetsAccount: acceptedBetAccount,
            player0: player0Address,
            player1: player1Address,
            server: localWallet.publicKey,
            gameClosedAccount: closedGamePDA,
            treasury: treasuryWallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([])
        .rpc({ commitment: 'confirmed' })
    console.log(`solana game closed`)
}