import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import {
    MoveInfo,
    PLAYER_WANTS_TO_PLAY_NO_BLOCKCHAIN, PLAYER_PLAYS,
    PLAYER_WANTS_TO_PLAY_HEDERA, PLAYER_WANTS_TO_PLAY_SOLANA,
    PlayerPlaysPayload,
    PlayerWantsToPlaySolanaPayload,
    PlayerWantsToPlayHederaPayload
} from "../../chaintrix-game-mechanics/dist";
import {
    playerPlays, joinOrCreateRoom
} from './SocketMethods'
import { BlockchainType, HederaPlayer, NoBlockchainPlayer, Player, SolanaPlayer } from "./types";

require('dotenv').config()
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    }
});

let interval;
const freeRoomsSolana: Array<string> = []
const freeRoomsHedera: Array<string> = []
const freeRoomsNoBlockchain: Array<string> = []
const roomObjects = {}
const solanaPlayers: { [socketID: string]: SolanaPlayer } = {}
const hederaPlayers: { [socketID: string]: HederaPlayer } = {}
const noBlockchainPlayers: { [socketID: string]: NoBlockchainPlayer } = {}
io.on("connection", (socket) => {
    console.log("New client connected");
    socket.on(PLAYER_WANTS_TO_PLAY_NO_BLOCKCHAIN, () => {
        joinOrCreateRoom(io, socket, freeRoomsNoBlockchain, roomObjects, noBlockchainPlayers, BlockchainType.NO_BLOCKCHAIN)
    });
    socket.on(PLAYER_WANTS_TO_PLAY_SOLANA, (payload: PlayerWantsToPlaySolanaPayload) => {
        joinOrCreateRoom(io, socket, freeRoomsSolana, roomObjects, solanaPlayers, BlockchainType.SOLANA, payload, null)
    });
    socket.on(PLAYER_WANTS_TO_PLAY_HEDERA, (payload: PlayerWantsToPlayHederaPayload) => {
        joinOrCreateRoom(io, socket, freeRoomsHedera, roomObjects, hederaPlayers, BlockchainType.HEDERA, null, payload)
    });
    socket.on(PLAYER_PLAYS, (payload: PlayerPlaysPayload) => {
        playerPlays(io, socket, roomObjects, payload)
    });

    // if (interval) {
    //     clearInterval(interval);
    // }
    // interval = setInterval(() => getApiAndEmit(socket), 997);
    // socket.on("disconnect", () => {
    //     console.log("Client disconnected");
    //     clearInterval(interval);
    // });
});

const getApiAndEmit = socket => {
    const response = new Date();
    // Emitting a new message. Will be consumed by the client
    socket.emit("FromAPI", response);
};

const port = 4001
httpServer.listen(port, () => console.log(`Listening on port ${port}`));
