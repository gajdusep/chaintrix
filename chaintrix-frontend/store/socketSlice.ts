import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, store } from './store';
import socketIOClient, { Socket } from "socket.io-client";
import { LOCALHOST_SOCKET_ENDPOINT, PRODUCTION_SOCKET_ENDPOINT } from '../helpers/Constants';
import {
    GameFinishedGenericPayload, GameFinishedHederaPayload, GameFinishedNoBlockchainPayload,
    GameFinishedSolanaPayload, GameStartedPayload,
    GAME_FINISHED_AND_WAITING_FOR_FINALIZATION, GAME_FINISHED_HEDERA, GAME_FINISHED_NO_BLOCKCHAIN,
    GAME_FINISHED_SOLANA, GAME_STARTED, PlayerPlayedPayload, PLAYER_PLAYED,
    SOCKET_CREATED_ROOM_AND_WAITING, SOCKET_ERROR
} from 'chaintrix-game-mechanics';
import {
    GameRunningState, onPlayerPlayedSocketEvent, setGameRunningState,
    setGameState, setPlayerID, setSeconds, setSocketError
} from './gameStateSlice';
import { setGameResult, setHederaResult, setSolanaResult } from './blockchainStateSlice';

export interface SocketState {
    socketClient: Socket
}

// const socketClient = socketIOClient(LOCALHOST_SOCKET_ENDPOINT);
const socketClient = socketIOClient(PRODUCTION_SOCKET_ENDPOINT);

socketClient.on(PLAYER_PLAYED, (payload: PlayerPlayedPayload) => {
    console.log(`player played!!!: ${JSON.stringify(payload)}`)
    store.dispatch(onPlayerPlayedSocketEvent(payload))
    store.dispatch(setSeconds(null))
});
socketClient.on(GAME_STARTED, (payload: GameStartedPayload) => {
    console.log(`whyyyyy ${payload}, ${JSON.stringify(payload)}`)
    store.dispatch(setGameState({ gameState: payload.gameState, seconds: payload.seconds }))
    store.dispatch(setPlayerID(payload.playerID))
});
socketClient.on(GAME_FINISHED_AND_WAITING_FOR_FINALIZATION, (payload: GameFinishedGenericPayload) => {
    store.dispatch(setGameResult(payload))
    store.dispatch(setGameRunningState(GameRunningState.FINISHED_AND_WAITING_FOR_FINALIZATION))
});
socketClient.on(GAME_FINISHED_NO_BLOCKCHAIN, (payload: GameFinishedNoBlockchainPayload) => {
    store.dispatch(setGameResult(payload))
    store.dispatch(setGameRunningState(GameRunningState.FINISHED))
});
socketClient.on(GAME_FINISHED_SOLANA, (payload: GameFinishedSolanaPayload) => {
    store.dispatch(setSolanaResult(payload))
    store.dispatch(setGameRunningState(GameRunningState.FINISHED))
});
socketClient.on(GAME_FINISHED_HEDERA, (payload: GameFinishedHederaPayload) => {
    store.dispatch(setHederaResult(payload))
    store.dispatch(setGameRunningState(GameRunningState.FINISHED))
});
socketClient.on(SOCKET_ERROR, (payload) => {
    store.dispatch(setSocketError(payload))
});
socketClient.on(SOCKET_CREATED_ROOM_AND_WAITING, () => {
    store.dispatch(setGameRunningState(GameRunningState.BET_CONFIRMED_NOW_WAITING))
});


const initialState: SocketState = {
    socketClient: socketClient
};

export const socketSlice = createSlice({
    name: 'socket',
    initialState,
    reducers: {
        setOnEvent: (state, action: PayloadAction<{ event: string, func: (...args: any[]) => void }>) => {
            const event = action.payload.event
            const func = action.payload.func
            state.socketClient.on(event, func)
        }
    },
});

export const {
    setOnEvent,
} = socketSlice.actions;

export const selectSocketClient = (state: RootState) => state.socketSlice.socketClient;
export const selectSocketConnected = (state: RootState) => state.socketSlice.socketClient.connected;

export default socketSlice.reducer;
