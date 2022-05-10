import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk } from './store';
import { fetchCount } from './counterAPI';
import {
    Board, BoardFieldType, Sizes, calculateSizes, getTilePosition,
    getHexPositions, calculatePlayersTilesPositions, Coords,
    CardNullable, Card, HexPosition, GameState,
    checkValidity, getNewGameState,
    getBoardHeight, getBoardWidth, addCardToBoard, mod,
    getStateAfterMove, getRandomUnusedCardAndAlterArray,
    updateGameStateAfterUnusedCardSelected,
    PLAYER_PLAYS, PlayerPlaysPayload, isCardInBoard,
    PlayerPlayedPayload,
    GameStartedPlayerIDPayload,
    calculateLongestPathForColor
} from '../../chaintrix-game-mechanics/dist/index.js';
import { Socket } from 'socket.io-client';

export interface ClientGameState {
    playerID: number,
    gameState: GameState,
    playersCardsView: Array<Card>,
    sizes: Sizes,
    gameRunning: boolean
}

const INITIAL_WIDTH = 500
const INITIAL_HEIGHT = 600

const newGameState = getNewGameState()
// const initialState: GameStateState = {
//     gameState: newGameState,
//     playersCardsView: newGameState.playersStates[newGameState.currentlyMovingPlayer].cards,
//     sizes: calculateSizes(3, 3, INITIAL_WIDTH, INITIAL_HEIGHT)
// };
const initialState: ClientGameState = {
    playerID: -1,
    gameState: newGameState,
    playersCardsView: [],
    sizes: calculateSizes(3, 3, INITIAL_WIDTH, INITIAL_HEIGHT),
    gameRunning: false
}

const getNewCardView = (state: ClientGameState): Array<Card> => {
    if (state.playerID == -1) {
        return [];
    }
    const newCardView = []
    // const cards = state.gameState.playersStates[state.gameState.currentlyMovingPlayer].cards
    const cards = state.gameState.playersStates[state.playerID].cards
    for (let i = 0; i < cards.length; i++) {
        if (state.playersCardsView[i].cardID == cards[i].cardID) {
            newCardView.push(state.playersCardsView[i])
        }
        else {
            newCardView.push(cards[i])
        }
    }
    return newCardView
}

export const gameStateSlice = createSlice({
    name: 'gameState',
    initialState,
    // The `reducers` field lets us define reducers and generate associated actions
    reducers: {
        setGameState: (state, action: PayloadAction<{ gameState: GameState }>) => {
            console.log(`hhhhhhhhhhhhhhhhhhhhhhhhhhh ${JSON.stringify(action.payload.gameState)}`)
            const gameState = action.payload.gameState;
            state.gameState = gameState;
            state.playersCardsView = gameState.playersStates[gameState.currentlyMovingPlayer].cards
            state.sizes = calculateSizes(3, 3, INITIAL_WIDTH, INITIAL_HEIGHT)
            state.gameRunning = true;
        },
        setPlayerID: (state, action: PayloadAction<GameStartedPlayerIDPayload>) => {
            state.playerID = action.payload.playerID
            state.playersCardsView = getNewCardView(state)
        },
        addCardToBoardAction: (state, action: PayloadAction<{ card: Card, x: number, y: number }>) => {
            // TODO: add sizes to the state! - in here, change the sizes based on the new board
            const newBoard = addCardToBoard(state.gameState.board, action.payload.card, action.payload.x, action.payload.y)
            state.gameState.board = newBoard
            state.sizes = calculateSizes(getBoardWidth(newBoard), getBoardHeight(newBoard), INITIAL_WIDTH, INITIAL_HEIGHT)
        },
        onPlayerPlayedSocketEvent: (state, action: PayloadAction<PlayerPlayedPayload>) => {
            console.log(`in game state slice: ${JSON.stringify(action.payload)}`)

            if (!isCardInBoard(state.gameState.board, action.payload.playedCard.cardID)) {
                state.gameState.board = addCardToBoard(state.gameState.board, action.payload.playedCard, action.payload.x, action.payload.y)
                state.sizes = calculateSizes(getBoardWidth(state.gameState.board), getBoardHeight(state.gameState.board), INITIAL_WIDTH, INITIAL_HEIGHT)
            }

            state.gameState = updateGameStateAfterUnusedCardSelected(state.gameState, action.payload.playedCard.cardID, action.payload.newCardID)

            state.gameState = getStateAfterMove(state.gameState)
            state.playersCardsView = getNewCardView(state)

            // TODO: make this visible in client
            calculateLongestPathForColor(state.gameState.board, 'R')
            calculateLongestPathForColor(state.gameState.board, 'G')
            calculateLongestPathForColor(state.gameState.board, 'B')
            calculateLongestPathForColor(state.gameState.board, 'Y')
        },
        addCardToBoardSocket: (state, action: PayloadAction<{ socketClient: Socket, card: Card, x: number, y: number }>) => {
            const playerPlaysPayload: PlayerPlaysPayload = {
                playerID: state.gameState.currentlyMovingPlayer,
                card: action.payload.card,
                x: action.payload.x,
                y: action.payload.y
            }
            action.payload.socketClient.emit(PLAYER_PLAYS, playerPlaysPayload)
            const newBoard = addCardToBoard(state.gameState.board, action.payload.card, action.payload.x, action.payload.y)
            state.gameState.board = newBoard
            state.sizes = calculateSizes(getBoardWidth(newBoard), getBoardHeight(newBoard), INITIAL_WIDTH, INITIAL_HEIGHT)
        },
        replaceGivenCardWithNewOne: (state, action: PayloadAction<{ card: Card, playerIndex: number, cardIndex: number }>) => {
            // state.gameState.playersStates[action.payload.playerIndex].cards[action.payload.cardIndex] = action.payload.card
            console.log(`before altering: ${state.gameState.unusedCards.length}`)
            const newCard = getRandomUnusedCardAndAlterArray(state.gameState.unusedCards)
            state.gameState.playersStates[action.payload.playerIndex].cards[action.payload.cardIndex] = newCard
            console.log(`after altering: ${state.gameState.unusedCards.length}`)
        },
        updateStateAfterMove: (state) => {
            state.gameState = getStateAfterMove(state.gameState)
        },
        updateCardView: (state) => {
            const newCardView = []
            const cards = state.gameState.playersStates[state.gameState.currentlyMovingPlayer].cards
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
    updateCardView,
    updateStateAfterMove,
    setGameState,
    onPlayerPlayedSocketEvent,
    addCardToBoardSocket,
    setPlayerID
} = gameStateSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectGameState = (state: RootState) => state.gameStateSlice.gameState;
export const selectPlayerID = (state: RootState) => {
    if (state.gameStateSlice.playerID == -1) {
        return 0;
    }
    return state.gameStateSlice.playerID
}
export const selectSizes = (state: RootState) => state.gameStateSlice.sizes;
export const selectPlayersCardsView = (state: RootState) => state.gameStateSlice.playersCardsView;
export const selectGameRunning = (state: RootState) => state.gameStateSlice.gameRunning;

export default gameStateSlice.reducer;
