import { Server, Socket } from "socket.io";
import {
    Player, SolanaPlayer, NoBlockchainPlayer,
    HederaPlayer, AcceptedBetInfo
} from "../types";
import {
    getNewGameState, GAME_STARTED, PlayerWantsToPlaySolanaPayload,
    SOCKET_ERROR, ALREADY_IN_ROOM_ERROR_MSG, SOCKET_CREATED_ROOM_AND_WAITING,
    SOLANA_BET_ACCOUNT_ERROR_MSG, HEDERA_BET_ERROR_MSG,
    PlayerWantsToPlayHederaPayload, GameStartedPayload, BlockchainType, GameClosedReason, ACCEPT_BETS_ERROR
} from 'chaintrix-game-mechanics';
// } from '../../../chaintrix-game-mechanics';
import { acceptBetsSolana, checkBetAccount, solanaCloseBetWithoutPlaying } from "../blockchainMethods/solanaMethods";
import { acceptBetsHedera, checkPlayerBet, getHederaConfig, hederaCloseBetWithoutPlaying, toSolidity } from "../blockchainMethods/hederaMethods";
import { INITIAL_TIME, SERVER_INITIAL_TIME } from "../constants";
import { getNewTimer, RoomObjects } from "../gameRoom";
import { closeGameCallback } from "./closeGame";
import { v4 as uuidv4 } from 'uuid';

const getNewRoomName = (): string => {
    const room = uuidv4();
    // const room = (Math.floor(Math.random() * 100000)).toString()
    return room;
}

const getJoiningPlayerNoBlockchain = (socket: Socket): NoBlockchainPlayer => {
    return {
        socketID: socket.id
    }
}

const getJoiningPlayerSolana = async (
    socket: Socket, solanaPayload: PlayerWantsToPlaySolanaPayload
): Promise<SolanaPlayer | null> => {
    if ((await checkBetAccount(solanaPayload)) == false) {
        return null;
    }

    return {
        address: solanaPayload.playerAddress,
        betPDA: solanaPayload.betPDA,
        socketID: socket.id
    }
}

const getJoiningPlayerHedera = async (
    socket: Socket, hederaPayload: PlayerWantsToPlayHederaPayload
): Promise<HederaPlayer | null> => {
    console.log(`checking hedera play bet for player: ${hederaPayload.playerAddress}`)
    if ((await checkPlayerBet(hederaPayload)) == false) {
        return null;
    }

    return {
        socketID: socket.id,
        address: hederaPayload.playerAddress
    }
}


export const joinOrCreateRoom = async (sio: Server, socket: Socket,
    freeRooms: Array<string>, roomObjects: RoomObjects, waitingPlayers: { [socketID: string]: Player },
    blockchainType: BlockchainType,
    solanaPayload?: PlayerWantsToPlaySolanaPayload,
    hederaPayload?: PlayerWantsToPlayHederaPayload
) => {
    if (socket.rooms.size >= 2) {
        socket.emit(SOCKET_ERROR, ALREADY_IN_ROOM_ERROR_MSG);
        console.log(`Player ${socket.id} tried to connect again`)
        return;
    }

    // Check Hedera and Solana account, if everything is fine, continue
    let joiningPlayer = null
    switch (blockchainType) {
        case BlockchainType.NO_BLOCKCHAIN:
            joiningPlayer = getJoiningPlayerNoBlockchain(socket);
            break;
        case BlockchainType.SOLANA:
            joiningPlayer = await getJoiningPlayerSolana(socket, solanaPayload)
            if (joiningPlayer == null) {
                socket.emit(SOCKET_ERROR, SOLANA_BET_ACCOUNT_ERROR_MSG)
                return;
            }
            break;
        case BlockchainType.HEDERA:
            joiningPlayer = await getJoiningPlayerHedera(socket, hederaPayload)
            if (joiningPlayer == null) {
                socket.emit(SOCKET_ERROR, HEDERA_BET_ERROR_MSG)
                return;
            }
            break;
    }

    // there is not already created room, so joining player creates one and joins it
    if (!freeRooms || !freeRooms.length) {
        const gameRoomID = getNewRoomName();
        freeRooms.push(gameRoomID);
        waitingPlayers[socket.id] = joiningPlayer
        socket.join(gameRoomID);
        socket.emit(SOCKET_CREATED_ROOM_AND_WAITING);

        console.log(`${blockchainType} Room created: created, roomID: ${gameRoomID}, player0: ${JSON.stringify(joiningPlayer)}`);
        return;
    }

    // get free room, remove it from the free rooms, and join it
    const gameRoomID = freeRooms[0];
    freeRooms.shift();
    socket.join(gameRoomID);

    // get the already present player and accept bets
    let clients = Array.from(sio.sockets.adapter.rooms.get(gameRoomID));
    const waitingPlayerSocketID = clients[0]
    const waitingPlayer = waitingPlayers[waitingPlayerSocketID];
    delete waitingPlayers[waitingPlayerSocketID];

    let acceptedBetInfo: AcceptedBetInfo = null
    switch (blockchainType) {
        case BlockchainType.NO_BLOCKCHAIN:
            break;
        case BlockchainType.SOLANA:
            if (waitingPlayer == undefined || waitingPlayer == null) {
                sio.to(gameRoomID).emit(SOCKET_ERROR, ACCEPT_BETS_ERROR)
                await solanaCloseBetWithoutPlaying(joiningPlayer as SolanaPlayer)
                return;
            }
            const acceptedBetsPDA = await acceptBetsSolana(
                (waitingPlayer as SolanaPlayer).betPDA,
                (joiningPlayer as SolanaPlayer).betPDA
            )
            if (acceptedBetsPDA == null) {
                await solanaCloseBetWithoutPlaying(waitingPlayer as SolanaPlayer)
                await solanaCloseBetWithoutPlaying(joiningPlayer as SolanaPlayer)
                sio.to(gameRoomID).emit(SOCKET_ERROR, ACCEPT_BETS_ERROR)
                return;
            }

            acceptedBetInfo = {
                acceptedBetAccount: acceptedBetsPDA.toBase58()
            }
            break;
        case BlockchainType.HEDERA:
            const hederaConfig = getHederaConfig()
            if (waitingPlayer == undefined || waitingPlayer == null) {
                hederaCloseBetWithoutPlaying(hederaConfig, joiningPlayer as HederaPlayer)
                sio.to(gameRoomID).emit(SOCKET_ERROR, ACCEPT_BETS_ERROR)
                return;
            }
            try {
                const result = await acceptBetsHedera(
                    hederaConfig,
                    toSolidity((waitingPlayer as HederaPlayer).address),
                    toSolidity((joiningPlayer as HederaPlayer).address)
                )
                acceptedBetInfo = {}
            } catch (error) {
                hederaCloseBetWithoutPlaying(hederaConfig, waitingPlayer as HederaPlayer)
                hederaCloseBetWithoutPlaying(hederaConfig, joiningPlayer as HederaPlayer)
                sio.to(gameRoomID).emit(SOCKET_ERROR, ACCEPT_BETS_ERROR)
                return;
            }
            break;
    }

    // save a new Room object with all information
    const playersInRoom = [waitingPlayer, joiningPlayer];
    const newGameState = getNewGameState()
    roomObjects[gameRoomID] = {
        players: playersInRoom,
        gameState: newGameState,
        blockchainType: blockchainType,
        acceptedBetInfo: acceptedBetInfo
    }
    const room = roomObjects[gameRoomID]
    room.remainingTime = SERVER_INITIAL_TIME;
    room.timer = getNewTimer(room, () => closeGameCallback(room, sio, gameRoomID, GameClosedReason.TIMEOUT))

    console.log(`${blockchainType} new gameroom created with players: ${JSON.stringify(playersInRoom)}`)

    const player0Payload: GameStartedPayload = { playerID: 0, gameState: newGameState, seconds: INITIAL_TIME }
    const player1Payload: GameStartedPayload = { playerID: 1, gameState: newGameState, seconds: INITIAL_TIME }

    if (waitingPlayer) sio.to(waitingPlayer.socketID).emit(GAME_STARTED, player0Payload)
    if (joiningPlayer) sio.to(joiningPlayer.socketID).emit(GAME_STARTED, player1Payload)
    // sio.to(gameRoomID).emit(GAME_STARTED, newGameState)
}
