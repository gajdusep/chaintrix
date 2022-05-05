import {
    GameState
} from "../../chaintrix-game-mechanics/dist"
// } from 'chaintrix-game-mechanics';

export enum BlockchainType {
    SOLANA,
    HEDERA,
    NO_BLOCKCHAIN
}

export type GameRoom = {
    players: Array<Player>,
    blockchainType: BlockchainType,
    gameState: GameState,
    acceptedBetInfo?: AcceptedBetInfo
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
