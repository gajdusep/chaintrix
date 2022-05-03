import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { MoveInfo } from "../../chaintrix-game-mechanics/dist";
import {
    joinRoomOrCreate,
    playersTurn
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
