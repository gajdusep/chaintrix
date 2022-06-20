import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk } from './store';
import {
    BlockchainType, GameClosedReason, GameFinishedGenericPayload, GameFinishedHederaPayload, GameFinishedSolanaPayload
} from '../../chaintrix-game-mechanics/dist/index.js';

interface SolanaState {
    opponentAddress: string,
    betPDA: string,
    acceptedPDA: string,
    closedGamePDA: string,
}

interface HederaState {
    opponentAddress: string,

}
interface GenericGameResult {
    winnerIndex: number,
    gameClosedReason: GameClosedReason
}

export interface BlockchainStateSlice {
    blockchainType: BlockchainType | null,
    gameResult: GenericGameResult | null,
    hederaState: HederaState | null,
    solanaState: SolanaState | null
}

const initialState: BlockchainStateSlice = {
    blockchainType: null,
    gameResult: null,
    hederaState: null,
    solanaState: null
}

export const blockchainStateSlice = createSlice({
    name: 'gameState',
    initialState,
    // The `reducers` field lets us define reducers and generate associated actions
    reducers: {
        setBlockchainType: (state, action: PayloadAction<BlockchainType>) => {
            state.blockchainType = action.payload;
        },
        setGameResult: (state, action: PayloadAction<GameFinishedGenericPayload>) => {
            state.gameResult = action.payload;
        },
        setSolanaResult: (state, action: PayloadAction<GameFinishedSolanaPayload>) => {
            state.gameResult = action.payload;
        },
        setHederaResult: (state, action: PayloadAction<GameFinishedHederaPayload>) => {
            state.gameResult = action.payload;
        },
    },
});

export const {
    setBlockchainType, setGameResult, setSolanaResult, setHederaResult
} = blockchainStateSlice.actions;


export const selectBCType = (state: RootState): BlockchainType | null => state.blockchainStateSlice.blockchainType;
export const selectBCState = (state: RootState): BlockchainStateSlice => state.blockchainStateSlice;

export default blockchainStateSlice.reducer;
