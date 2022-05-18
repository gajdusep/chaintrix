import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk } from './store';
import socketIOClient, { Socket } from "socket.io-client";
import { LOCALHOST_PROGRAM_ID, LOCALHOST_SOCKET_ENDPOINT, LOCALHOST_SOLANA_ENDPOINT } from '../helpers/Constants';

export interface SocketState {
    socketClient: Socket
}

const socketClient = socketIOClient(LOCALHOST_SOCKET_ENDPOINT);
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
