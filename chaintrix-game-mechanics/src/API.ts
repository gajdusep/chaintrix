
// TODO: add payload types

import { Card } from "./CustomTypes"
import { GameState } from "./Game"

export const PLAYER_WANTS_TO_PLAY_NO_BLOCKCHAIN = 'playerWantsToPlayNoBlockchain'
// export type PlayerWantsToPlayNoBlockchain = {

// }

export const PLAYER_WANTS_TO_PLAY_SOLANA = 'playerWantsToPlaySolana'
export type PlayerWantsToPlaySolanaPayload = {
    betPDA: string;
    playerAddress: string;
}

export const PLAYER_WANTS_TO_PLAY_HEDERA = 'playerWantsToPlayHedera'
export type PlayerWantsToPlayHedera = {

}

export const GAME_STARTED = 'gameStarted'
export type GameStartedPayload = {
    gameState: GameState
}

export const GAME_STARTED_PLAYER_ID = 'gameStartedPlayerID'
export type GameStartedPlayerIDPayload = {
    playerID: number
}

export const PLAYER_PLAYS = 'playerPlays'
export type PlayerPlaysPayload = {
    playerID: number,
    card: Card,
    x: number,
    y: number
}

export const PLAYER_PLAYED = 'playerPlayed'
export type PlayerPlayedPayload = {
    playedCard: Card,
    x: number,
    y: number,
    newCardID: string
}

export const GAME_FINISHED = 'gameFinished'

