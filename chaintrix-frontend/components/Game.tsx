import styles from '../components/Hexagons.module.css'
import Draggable, { DraggableData, DraggableEvent, DraggableEventHandler } from 'react-draggable'; // The default
import { useEffect, useState } from 'react';
import GameTileSpace from './GameTileSpace'
import {
    Board, BoardFieldType, Sizes, calculateSizes, getTilePosition,
    getHexPositions, calculatePlayersTilesPositions, Coords,
    CardNullable, Card, HexPosition, GameState,
    checkValidity, addCardToBoard,
    getBoardHeight, getBoardWidth, getObligatoryPlayersCards,
    PLAYER_PLAYED, GAME_STARTED, PlayerPlayedPayload,
    GameStartedPayload, PLAYER_WANTS_TO_PLAY_NO_BLOCKCHAIN,
    GAME_STARTED_PLAYER_ID, GameStartedPlayerIDPayload
} from '../../chaintrix-game-mechanics/dist/index.js';
// } from 'chaintrix-game-mechanics';
import {
    selectGameState, selectSizes, addCardToBoardAction, replaceGivenCardWithNewOne, selectPlayersCardsView,
    rotateCardInCardView, updateCardView, updateStateAfterMove, setGameState,
    onPlayerPlayedSocketEvent,
    addCardToBoardSocket, setPlayerID, selectPlayerID, selectGameRunning
} from '../store/gameStateSlice';
import { selectSocketClient, setOnEvent } from '../store/socketSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import React from 'react'
import OponentsBanner from '../components/OponentsBanner';
import GameBoard from '../components/GameBoard';

const Game = () => {
    const gameState = useAppSelector(selectGameState);
    const socketClient = useAppSelector(selectSocketClient);
    const playerID = useAppSelector(selectPlayerID)
    const dispatch = useAppDispatch();
    const gameRunning = useAppSelector(selectGameRunning)

    useEffect((): any => {
        console.log(`setting onevents`)
        dispatch(setOnEvent({
            event: GAME_STARTED, func: (payload: GameState) => {
                console.log(`whyyyyy ${payload}, ${JSON.stringify(payload)}`)

                dispatch(setGameState({ gameState: payload }))
            }
        }));
        dispatch(setOnEvent({
            event: PLAYER_PLAYED, func: (payload: PlayerPlayedPayload) => {
                console.log(`player played!!!: ${JSON.stringify(payload)}`)
                dispatch(onPlayerPlayedSocketEvent(payload))
            }
        }));
        dispatch(setOnEvent({
            event: GAME_STARTED_PLAYER_ID, func: (payload: GameStartedPlayerIDPayload) => {
                dispatch(setPlayerID(payload))
            }
        }));
        console.log(`finished onevents`)
        // socketClient.emit(PLAYER_WANTS_TO_PLAY_NO_BLOCKCHAIN, {});
    }, []);

    const onPlayNoBCCLick = () => {
        socketClient.emit(PLAYER_WANTS_TO_PLAY_NO_BLOCKCHAIN, {});
    }

    if (gameRunning) return (
        <div style={{ display: 'flex', width: `100%`, justifyContent: 'center' }}>
            <div>
                <GameBoard />
            </div>
            <div>
                <OponentsBanner />
            </div>
        </div>
    )

    return (
        <div style={{ display: 'flex', width: `100%`, justifyContent: 'center' }}>
            <button onClick={() => onPlayNoBCCLick()}>Play with no blockchain</button>
        </div>
    )



}

export default Game;
