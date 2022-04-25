import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Server, Socket } from "socket.io";
import { Connection, PublicKey } from '@solana/web3.js';
import { Player, RoomGame } from "./types";
import { IDL, ChaintrixSolana } from './types/chaintrix_solana';
import { randomBytes } from "crypto";
import { LOCALHOST_PROGRAM_ID, LOCALHOST_SOLANA_ENDPOINT } from "./Constants";

const NUMBER_OF_PLAYERS = 2

type RoomObjects = { [key: string]: RoomGame }

const getGameRoomID = (socket: Socket): string | null => {
    if (socket.rooms.size != 2) return null
    let answer = null
    socket.rooms.forEach(item => {
        if (item != socket.id) { answer = item };
    })
    return answer;
}

// TODO: check if the betPDA was really done by playerAddress...
// load the account and check the data
export const joinRoomOrCreate = async (sio: Server, socket: Socket,
    freeRooms: Array<string>, roomObjects: RoomObjects, players: { [socketID: string]: Player },
    betPDA: string, playerAddress: string
) => {
    let roomID = "blbost";
    const roomsList = Array.from(socket.rooms)
    console.log(roomsList);
    console.log(`betPDA: '${betPDA}';`)

    const connection = new Connection(LOCALHOST_SOLANA_ENDPOINT)
    const provider = anchor.AnchorProvider.local(LOCALHOST_SOLANA_ENDPOINT);
    const program = new Program(IDL, LOCALHOST_PROGRAM_ID, provider);
    const localWallet = anchor.Wallet.local();

    const pubKey = new PublicKey(betPDA)
    const balance = await connection.getBalance(pubKey);
    console.log(`balance is: ${balance}`);

    // automatically in a room with socket id and moreover in a game room
    if (socket.rooms.size >= 2) {
        roomID = `already in a room ${getGameRoomID(socket)}`;
    } else if (!freeRooms || !freeRooms.length) {
        // const room = uuid();
        roomID = (Math.floor(Math.random() * 100000)).toString();
        console.log(`${socket.id} created, roomID: ${roomID}`);
        freeRooms.push(roomID);
        players[socket.id] = { betPDA: betPDA, socketID: socket.id, clicks: 0, playerAddress: playerAddress }
        socket.join(roomID);
    } else {
        roomID = freeRooms[0];
        let clients = sio.sockets.adapter.rooms.get(roomID);
        const player0: Player = players[Array.from(clients)[0]];
        delete players[clients[0]];
        const player1: Player = { socketID: socket.id, betPDA: betPDA, clicks: 0, playerAddress: playerAddress };
        console.log(`${socket.id} wants to join, roomID: ${roomID}`);
        socket.join(roomID);

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
                    player0BetAccount: player0.betPDA,
                    player1BetAccount: player1.betPDA,
                    server: localWallet.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([])
                .rpc({ commitment: 'confirmed' })
        } catch (e) {
            console.log(e);
            // TODO: return or retry but don't continue
        }

        const playersInRoom = [player0, player1];
        sio.to(roomID).emit("gameStarted")

        console.log(`clients list: ${JSON.stringify(playersInRoom)}`)
        roomObjects[roomID] = {
            players: playersInRoom,
            playerNPlaying: 0,
            solanaAcceptedBetAccount: acceptedBetsPDA.toBase58()
        }
        freeRooms.shift();


        // TODO: call smart contract: accept bets
    }

    socket.emit("joinedOrCreated", { 'roomID': roomID })
}

// TODO: if these methods are async, will it make any problems? 
// TODO: keep some variables that will be changed (e.g. game closed etc, if the game is already closed, don't do anything)
export const playersTurn = async (sio: Server, socket: Socket, roomObjects: RoomObjects) => {
    const roomGameID = getGameRoomID(socket);

    const room = roomObjects[roomGameID]

    console.log(`the socket ${socket.id} called playersTurn. RoomID: ${roomGameID}`)
    // TODO: better error handling here
    if (!room) return;

    room.players[room.playerNPlaying].clicks += 1;

    // the finishing condition (artificial rn)
    if (room.players[room.playerNPlaying].clicks > 2) {
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
        const tx = await program.methods.closeGameWithWinner(closedGamePDABump, seed, 1)
            .accounts({
                acceptedBetsAccount: room.solanaAcceptedBetAccount,
                player0: room.players[0].playerAddress,
                player1: room.players[1].playerAddress,
                server: localWallet.publicKey,
                gameClosedAccount: closedGamePDA,
                treasury: treasuryWallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([])
            .rpc({ commitment: 'confirmed' })

        console.log(`gameSuccesfullyFinished`)
        sio.to(roomGameID).emit("gameSuccesfullyFinished")
        return
        // TODO call a smart contract finish game
    }

    room.playerNPlaying = (room.playerNPlaying + 1) % room.players.length
    // socket.leave(roomGameID)
    sio.to(roomGameID).emit('playerPlayed', `(playerPlaying: ${room.playerNPlaying} clicked ${room.players[room.playerNPlaying].clicks} times)`);
}

