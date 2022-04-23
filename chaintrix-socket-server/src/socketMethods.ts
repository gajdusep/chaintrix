import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Server, Socket } from "socket.io";
import { Connection, PublicKey } from '@solana/web3.js';
import { Player, RoomGame } from "./types";
import { IDL, ChaintrixSolana } from './types/chaintrix_solana';
import { randomBytes } from "crypto";

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

export const joinRoomOrCreate = async (sio: Server, socket: Socket,
    freeRooms: Array<string>, roomObjects: RoomObjects, players: { [socketID: string]: Player },
    betPDA: string
) => {
    let roomID = "blbost";
    const roomsList = Array.from(socket.rooms)
    console.log(roomsList);
    console.log(`betPDA: '${betPDA}';`)

    const solanaURL = 'http://127.0.0.1:8899'
    const connection = new Connection('http://127.0.0.1:8899')
    // const provider = new anchor.AnchorProvider(connection, anchorWallet, {})

    // anchor.setProvider(anchor.AnchorProvider.env());
    const provider = anchor.AnchorProvider.local(solanaURL);
    const program = new Program(IDL, "2Gv4zT6tX8jhkECtsDiSdmUaNxFkZSnrLerS1AzK7uxs", provider);
    const localWallet = anchor.Wallet.local();
    // anchor.setProvider(provider);
    // const program = anchor.workspace.ChaintrixSolana as Program<ChaintrixSolana>;
    // const provider = program.provider;


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
        players[socket.id] = { betPDA: betPDA, socketID: socket.id, clicks: 0 }
        socket.join(roomID);
    } else {
        roomID = freeRooms[0];
        let clients = sio.sockets.adapter.rooms.get(roomID);
        const player0: Player = players[Array.from(clients)[0]];
        delete players[clients[0]];
        const player1: Player = { socketID: socket.id, betPDA: betPDA, clicks: 0 };
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
        }

        const playersInRoom = [player0, player1];
        sio.to(roomID).emit("gameStarted")

        console.log(`clients list: ${JSON.stringify(playersInRoom)}`)
        roomObjects[roomID] = {
            players: playersInRoom,
            playerNPlaying: 0
        }
        freeRooms.shift();

        // TODO: call smart contract: accept bets
    }

    socket.emit("joinedOrCreated", { 'roomID': roomID })
}

export const playersTurn = (sio: Server, socket: Socket, roomObjects: RoomObjects) => {
    const roomGameID = getGameRoomID(socket);

    const room = roomObjects[roomGameID]

    console.log(`the socket ${socket.id} called playersTurn. RoomID: ${roomGameID}`)
    // TODO: better error handling here
    if (!room) return;

    room.players[room.playerNPlaying].clicks += 1;

    // the finishing condition (artificial rn)
    if (room.players[room.playerNPlaying].clicks > 2) {
        // TODO call a smart contract finish game
    }

    room.playerNPlaying = (room.playerNPlaying + 1) % room.players.length
    // socket.leave(roomGameID)
    sio.to(roomGameID).emit('playerPlayed', `(playerPlaying: ${room.playerNPlaying} clicked ${room.players[room.playerNPlaying].clicks} times)`);
}

