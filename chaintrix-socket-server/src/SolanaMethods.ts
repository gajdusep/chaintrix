import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Connection, PublicKey } from '@solana/web3.js';
import { SolanaPlayer, GameRoom, SolanaAcceptedBetInfo } from "./types";
import { IDL } from './types/chaintrix_solana';
import { randomBytes } from "crypto";
import { LOCALHOST_PROGRAM_ID, LOCALHOST_SOLANA_ENDPOINT } from "./Constants";

export const acceptBetsSolana = async (player0Address, player1Address): Promise<PublicKey> => {
    const connection = new Connection(LOCALHOST_SOLANA_ENDPOINT)
    const provider = anchor.AnchorProvider.local(LOCALHOST_SOLANA_ENDPOINT);
    const program = new Program(IDL, LOCALHOST_PROGRAM_ID, provider);
    const localWallet = anchor.Wallet.local();

    const seed = randomBytes(32);
    const [acceptedBetsPDA, acceptedBetsPDABump] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("accepted"), seed],
        program.programId
    );
    console.log(`accepted bet accounts: ${acceptedBetsPDA} ${acceptedBetsPDABump}`)
    try {
        // TODO: commitment (should be max?)
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
        console.log(e);
        // TODO: return or retry but don't continue
    }
    return acceptedBetsPDA;
}

export const closeGameSolana = async (room: GameRoom) => {
    const connection = new Connection(LOCALHOST_SOLANA_ENDPOINT)
    const provider = anchor.AnchorProvider.local(LOCALHOST_SOLANA_ENDPOINT);
    const program = new Program(IDL, LOCALHOST_PROGRAM_ID, provider);
    const localWallet = anchor.Wallet.local();

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
    const tx = await program.methods.closeGameWithWinner(closedGamePDABump, seed, 1)
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
}