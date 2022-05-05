import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import {
    MoveInfo,
    PLAYER_WANTS_TO_PLAY_NO_BLOCKCHAIN, PLAYER_PLAYS,
    PlayerPlaysPayload

} from "../../chaintrix-game-mechanics/dist";
import {
    joinRoomOrCreate,
    playersTurn, joinOrCreateRoomNoBlockchain,
    playerPlaysNoBlockchain
} from './SocketMethods'
import { Player } from "./types";

require('dotenv').config()
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    }
});

let interval;
const freeRooms = []
const roomObjects = {}
const players: { [socketID: string]: Player } = {}
io.on("connection", (socket) => {
    console.log("New client connected");

    // Host Events
    socket.on('wantsToPlay', (betPDA, playerAddress) => {
        joinRoomOrCreate(io, socket, freeRooms, roomObjects, players, betPDA, playerAddress)
    });
    socket.on('playersTurn', (moveInfo: MoveInfo) => {
        playersTurn(io, socket, roomObjects, moveInfo)
    });
    socket.on(PLAYER_WANTS_TO_PLAY_NO_BLOCKCHAIN, () => {
        joinOrCreateRoomNoBlockchain(io, socket, freeRooms, roomObjects, players)
    });
    socket.on(PLAYER_PLAYS, (payload: PlayerPlaysPayload) => {
        playerPlaysNoBlockchain(io, socket, roomObjects, payload)
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
