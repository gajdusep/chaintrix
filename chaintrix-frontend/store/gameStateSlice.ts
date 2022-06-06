import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk } from './store';
import { fetchCount } from './counterAPI';
import {
    Sizes, calculateSizes, CardNullable, Card, GameState, getNewGameState,
    getBoardHeight, getBoardWidth, addCardToBoard, mod, getStateAfterMove,
    updateGameStateAfterDeckCardSelected, PLAYER_PLAYS, PlayerPlaysPayload, isCardInBoard,
    PlayerPlayedPayload, calculateLongestPathForColor, GameFinishedNoBlockchainPayload,
} from '../../chaintrix-game-mechanics/dist/index.js';
import { Socket } from 'socket.io-client';

export enum GameRunningState {
    NOT_STARTED,
    BET_WAITING_FOR_BLOCKCHAIN_CONFIRMATION,
    BET_CONFIRMED_NOW_WAITING,
    RUNNING,
    FINISHED_AND_WAITING_FOR_FINALIZATION, // TODO: complete this running state!
    FINISHED
}

export interface ClientGameState {
    playerID: number,
    gameState: GameState,
    playersCardsView: Array<CardNullable>,
    sizes: Sizes,
    gameRunningState: GameRunningState,
    lengths: { [color: string]: number },
    error: string | null,
    initialSeconds: number,
    secondsRemaining: number
}

const INITIAL_WIDTH = 500
const INITIAL_HEIGHT = 600

const initialState: ClientGameState = {
    playerID: -1,
    gameState: getNewGameState(),
    playersCardsView: [],
    sizes: calculateSizes(3, 3, INITIAL_WIDTH, INITIAL_HEIGHT),
    gameRunningState: GameRunningState.NOT_STARTED,
    lengths: {},
    error: null,
    initialSeconds: 10,
    secondsRemaining: 10
}

const getNewCardView = (state: ClientGameState): Array<Card | null> => {
    if (state.playerID == -1) {
        return [];
    }
    const newCardView = []
    // const cards = state.gameState.playersStates[state.gameState.currentlyMovingPlayer].cards
    const cards = state.gameState.playersStates[state.playerID].cards
    for (let i = 0; i < cards.length; i++) {
        if (state.playersCardsView[i] == null || cards[i] == null) {
            newCardView.push(null)
        }
        else if (state.playersCardsView[i]!.cardID == cards[i]!.cardID) {
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
        setGameState: (state, action: PayloadAction<{ gameState: GameState, seconds: number }>) => {
            const gameState = action.payload.gameState;
            state.gameState = gameState;
            console.log(`hmmmm: ${JSON.stringify(gameState)}`)
            state.playersCardsView = gameState.playersStates[gameState.currentlyMovingPlayer].cards
            state.sizes = calculateSizes(3, 3, INITIAL_WIDTH, INITIAL_HEIGHT)
            state.gameRunningState = GameRunningState.RUNNING;
            state.initialSeconds = action.payload.seconds;
            state.secondsRemaining = action.payload.seconds;
        },
        setPlayerID: (state, action: PayloadAction<number>) => {
            state.playerID = action.payload
            state.playersCardsView = getNewCardView(state)
        },
        setSocketError: (state, action: PayloadAction<string>) => {
            state.error = action.payload
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
        onPlayerPlayedSocketEvent: (state, action: PayloadAction<PlayerPlayedPayload>) => {
            console.log(`in game state slice: ${JSON.stringify(action.payload)}`)

            if (!isCardInBoard(state.gameState.board, action.payload.playedCard.cardID)) {
                state.gameState.board = addCardToBoard(state.gameState.board, action.payload.playedCard, action.payload.x, action.payload.y)
                state.sizes = calculateSizes(getBoardWidth(state.gameState.board), getBoardHeight(state.gameState.board), INITIAL_WIDTH, INITIAL_HEIGHT)
            }

            state.gameState = getStateAfterMove(
                updateGameStateAfterDeckCardSelected(state.gameState, action.payload.playedCard.cardID, action.payload.newCardID)
            )

            // state.gameState = getStateAfterMove(state.gameState)
            state.playersCardsView = getNewCardView(state)

            // TODO: make this visible in client
            state.lengths['R'] = calculateLongestPathForColor(state.gameState.board, 'R')
            state.lengths['G'] = calculateLongestPathForColor(state.gameState.board, 'G')
            state.lengths['B'] = calculateLongestPathForColor(state.gameState.board, 'B')
            state.lengths['Y'] = calculateLongestPathForColor(state.gameState.board, 'Y')
        },
        updateStateAfterMove: (state) => {
            state.gameState = getStateAfterMove(state.gameState)
        },
        updateCardView: (state) => {
            const newCardView = []
            const cards = state.gameState.playersStates[state.gameState.currentlyMovingPlayer].cards
            state.playersCardsView = getNewCardView(state)
        },
        rotateCardInCardView: (state, action: PayloadAction<{ cardIndex: number }>) => {
            const cardIndex = action.payload.cardIndex;
            if (state.playersCardsView[cardIndex] != null) {
                state.playersCardsView[cardIndex]!.orientation = mod(state.playersCardsView[cardIndex]!.orientation + 1, 6)
            }
        },
        setGameRunningState: (state, action: PayloadAction<GameRunningState>) => {
            state.gameRunningState = action.payload;
        },
        // TODO set finished - solana, hedera, solana
        // TODO: remove the following two methods..?
        setGameFinishedNoBlockchain: (state, action: PayloadAction<GameFinishedNoBlockchainPayload>) => {
            state.gameRunningState = GameRunningState.FINISHED;
        },
        setGameFinished: (state) => {
            state.gameRunningState = GameRunningState.FINISHED;
        },
        resetAll: (state) => {
            state.gameRunningState = initialState.gameRunningState
            state.gameState = initialState.gameState
            state.playerID = initialState.playerID
            state.playersCardsView = initialState.playersCardsView
            state.sizes = calculateSizes(3, 3, INITIAL_WIDTH, INITIAL_HEIGHT)
            state.lengths = initialState.lengths
            state.error = null
        },
        setSeconds: (state, action: PayloadAction<number | null>) => {
            if (action.payload == null) {
                state.secondsRemaining = state.initialSeconds;
            } else {
                state.secondsRemaining = action.payload;
            }
        }
    },
});

export const {
    rotateCardInCardView, updateCardView,
    updateStateAfterMove, setGameState,
    onPlayerPlayedSocketEvent, addCardToBoardSocket,
    setPlayerID, setGameFinishedNoBlockchain, setSocketError, resetAll, setSeconds,
    setGameRunningState, setGameFinished
} = gameStateSlice.actions;

export const selectGameState = (state: RootState) => state.gameStateSlice.gameState;
export const selectPlayerID = (state: RootState) => {
    if (state.gameStateSlice.playerID == -1) {
        return 0;
    }
    return state.gameStateSlice.playerID
}
export const selectLengths = (state: RootState) => state.gameStateSlice.lengths;
export const selectSizes = (state: RootState) => state.gameStateSlice.sizes;
export const selectPlayersCardsView = (state: RootState) => state.gameStateSlice.playersCardsView;
export const selectGameRunningState = (state: RootState) => state.gameStateSlice.gameRunningState;
export const selectError = (state: RootState) => state.gameStateSlice.error;
export const selectIsCurrentlyPlaying = (state: RootState): boolean => {
    return state.gameStateSlice.playerID == state.gameStateSlice.gameState.currentlyMovingPlayer;
}
export const selectSeconds = (state: RootState): number => state.gameStateSlice.secondsRemaining;

export default gameStateSlice.reducer;
