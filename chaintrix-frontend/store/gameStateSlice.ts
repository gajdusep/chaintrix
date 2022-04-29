import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk } from './store';
import { fetchCount } from './counterAPI';
import {
    Board, BoardFieldType, Sizes, calculateSizes, getTilePosition,
    getHexPositions, calculatePlayersTilesPositions, Coords,
    CardNullable, Card, HexPosition, GameState,
    checkValidity, getNewGameState,
    getBoardHeight, getBoardWidth, addCardToBoard
} from '../../chaintrix-game-mechanics/dist/index.js';

export interface GameStateState {
    gameState: GameState,
}

const initialState: GameStateState = {
    gameState: getNewGameState()
};

export const gameStateSlice = createSlice({
    name: 'gameState',
    initialState,
    // The `reducers` field lets us define reducers and generate associated actions
    reducers: {
        addCardToBoardAction: (state, action: PayloadAction<{ card: Card, x: number, y: number }>) => {
            state.gameState.board = addCardToBoard(state.gameState.board, action.payload.card, action.payload.x, action.payload.y)
        },
        replaceGivenCardWithNewOne: (state, action: PayloadAction<{ card: Card, playerIndex: number, cardIndex: number }>) => {
            state.gameState.playersStates[action.payload.playerIndex].cards[action.payload.cardIndex] = action.payload.card
        },
        decrement2: (state) => {
            // state.value -= 1;
        },
        // Use the PayloadAction type to declare the contents of `action.payload`
        incrementByAmount2: (state, action: PayloadAction<number>) => {
            // state.value += action.payload;
        },
    },
});

export const { addCardToBoardAction, replaceGivenCardWithNewOne, decrement2, incrementByAmount2 } = gameStateSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectGameState = (state: RootState) => state.gameStateSlice.gameState;

export default gameStateSlice.reducer;
