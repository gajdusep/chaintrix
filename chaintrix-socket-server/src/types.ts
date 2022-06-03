import {
    GameState
} from "../../chaintrix-game-mechanics/dist"
// } from 'chaintrix-game-mechanics';

export enum BlockchainType {
    SOLANA = 'Solana',
    HEDERA = 'Hedera',
    NO_BLOCKCHAIN = 'NoBlockchain'
}

export type GameRoom = {
    players: Array<Player>,
    blockchainType: BlockchainType,
    gameState: GameState,
    acceptedBetInfo?: AcceptedBetInfo,
    timer?: ReturnType<typeof setInterval>,
    remainingTime?: number
}

interface GenericPlayer {
    socketID: string,
}

export interface SolanaPlayer extends GenericPlayer {
    address: string,
    betPDA: string,
}

export interface HederaPlayer extends GenericPlayer {
    address: string
}

export interface NoBlockchainPlayer extends GenericPlayer {

}

export type Player = SolanaPlayer | HederaPlayer | NoBlockchainPlayer;

export interface GenericAcceptedBetInfo {

}

export interface SolanaAcceptedBetInfo extends GenericAcceptedBetInfo {
    acceptedBetAccount: string
}

export interface HederaAcceptedBetInfo extends GenericAcceptedBetInfo {

}

export type AcceptedBetInfo = SolanaAcceptedBetInfo | HederaAcceptedBetInfo;
