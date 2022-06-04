import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import blockchainStateSlice from './blockchainStateSlice';
import counterReducer from './counterSlice';
import gameStateSlice from './gameStateSlice';
import hederaSlice from './hederaSlice';
import socketSlice from './socketSlice';


export const store = configureStore({
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false
    }),
    reducer: {
        counter: counterReducer,
        blockchainStateSlice: blockchainStateSlice,
        gameStateSlice: gameStateSlice,
        socketSlice: socketSlice,
        hederaSlice: hederaSlice
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
>;