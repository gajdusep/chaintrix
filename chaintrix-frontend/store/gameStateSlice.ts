import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk } from './store';
import { fetchCount } from './counterAPI';
import {
    Board, BoardFieldType, Sizes, calculateSizes, getTilePosition,
    getHexPositions, calculatePlayersTilesPositions, Coords,
    CardNullable, Card, HexPosition, GameState,
    checkValidity, getNewGameState,
    getBoardHeight, getBoardWidth, addCardToBoard, mod
} from '../../chaintrix-game-mechanics/dist/index.js';

export interface GameStateState {
    gameState: GameState,
    playersCardsView: Array<Card>,
    sizes: Sizes
}

const INITIAL_WIDTH = 500
const INITIAL_HEIGHT = 600

const newGameState = getNewGameState()
const initialState: GameStateState = {
    gameState: newGameState,
    playersCardsView: newGameState.playersStates[0].cards,
    sizes: calculateSizes(3, 3, INITIAL_WIDTH, INITIAL_HEIGHT)
};

export const gameStateSlice = createSlice({
    name: 'gameState',
    initialState,
    // The `reducers` field lets us define reducers and generate associated actions
    reducers: {
        addCardToBoardAction: (state, action: PayloadAction<{ card: Card, x: number, y: number }>) => {
            // TODO: add sizes to the state! - in here, change the sizes based on the new board
            const newBoard = addCardToBoard(state.gameState.board, action.payload.card, action.payload.x, action.payload.y)
            state.gameState.board = newBoard
            state.sizes = calculateSizes(getBoardWidth(newBoard), getBoardHeight(newBoard), INITIAL_WIDTH, INITIAL_HEIGHT)
        },
        replaceGivenCardWithNewOne: (state, action: PayloadAction<{ card: Card, playerIndex: number, cardIndex: number }>) => {
            state.gameState.playersStates[action.payload.playerIndex].cards[action.payload.cardIndex] = action.payload.card
        },
        updateCardView: (state) => {
            const newCardView = []
            const cards = state.gameState.playersStates[0].cards
            for (let i = 0; i < cards.length; i++) {
                if (state.playersCardsView[i].cardID == cards[i].cardID) {
                    newCardView.push(state.playersCardsView[i])
                }
                else {
                    newCardView.push(cards[i])
                }
            }
            state.playersCardsView = newCardView
        },
        rotateCardInCardView: (state, action: PayloadAction<{ cardIndex: number }>) => {
            state.playersCardsView[action.payload.cardIndex].orientation = mod(state.playersCardsView[action.payload.cardIndex].orientation + 1, 6)
        }
    },
});

export const {
    addCardToBoardAction,
    replaceGivenCardWithNewOne,
    rotateCardInCardView,
    updateCardView
} = gameStateSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectGameState = (state: RootState) => state.gameStateSlice.gameState;
export const selectSizes = (state: RootState) => state.gameStateSlice.sizes;
export const selectPlayersCardsView = (state: RootState) => state.gameStateSlice.playersCardsView;

export default gameStateSlice.reducer;
