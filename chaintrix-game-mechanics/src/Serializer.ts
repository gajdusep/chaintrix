import { GameClosedReason } from "./API";
import { GameState, Move, PlayerState } from "./Game";

export const serializeGame = (
    gameState: GameState, gameClosedReason: GameClosedReason
): string => {
    const movesSerialized = gameState.moves.map(move => serializeMove(move))
    const playersSerialized = gameState.playersStates.map(playerState => serializePlayer(playerState))
    const gameObject = {
        m: movesSerialized,
        p: playersSerialized,
        r: gameClosedReason
    }
    return JSON.stringify(gameObject)
}

export const deserializeGame = (s: string): {
    moves: Array<Move>,
    playerStates: Array<PlayerState>,
    gameClosedReason: GameClosedReason
} => {
    const parsed = JSON.parse(s)
    const moves = parsed.m.map(item => deserializeMove(item))
    const playerStates = parsed.p.map(item => deserializePlayer(item))
    return {
        moves: moves,
        playerStates: playerStates,
        gameClosedReason: parsed.r
    }
}

export const serializePlayer = (playerState: PlayerState): object => {
    return {
        c: playerState.color,
        ic: playerState.initialCards
    }
}

export const deserializePlayer = (item: any): PlayerState => {
    return {
        color: item.c,
        initialCards: item.ic,
        cards: []
    }
}

export const serializeMove = (move: Move): object => {
    return {
        p: {
            id: move.playedCard.cardID,
            or: move.playedCard.orientation
        },
        x: move.x,
        y: move.y,
        n: move.newCardID
    }
}

export const deserializeMove = (item: any): Move => {
    return {
        playedCard: {
            cardID: item.p.id,
            orientation: item.p.or,
        },
        x: item.x,
        y: item.y,
        newCardID: item.n
    }
}

export const serializeMoves = (moves: Array<Move>): string => {
    return JSON.stringify(moves.map(item => serializeMove(item)));
}

export const deserializeMoves = (s: string): Array<Move> => {
    const parsed = JSON.parse(s)
    const moves: Array<Move> = []
    for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i]
        moves.push({
            playedCard: {
                cardID: item.p.id,
                orientation: item.p.or,
            },
            x: item.x,
            y: item.y,
            newCardID: item.n
        })
    }
    return moves;
}
