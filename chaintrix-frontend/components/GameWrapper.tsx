import { useEffect, useState } from 'react';
import {
    GameState, PLAYER_PLAYED, GAME_STARTED, PlayerPlayedPayload,
    GameStartedPayload, GAME_FINISHED_NO_BLOCKCHAIN, GameFinishedNoBlockchainPayload,
    SOCKET_ERROR,
    SOCKET_CREATED_ROOM_AND_WAITING
} from '../../chaintrix-game-mechanics/dist/index.js';
// } from 'chaintrix-game-mechanics';
import {
    selectGameRunningState, selectLengths, GameRunningState,
    selectError, selectGameState, resetAll, selectSeconds, setSeconds
} from '../store/gameStateSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import React from 'react'
import OponentsBanner from './OponentsBanner';
import GameBoard from './GameBoard';
import {
    selectHederaConnectService, selectHederaStatus,
    initHederaAsync, addAvailableExtension, setPairedData
} from '../store/hederaSlice';
import GameSelect from './GameSelect';
import Description from './Description';
import { ParallaxProvider } from 'react-scroll-parallax';
import Background from './Background';
import ErrorComponent from './ErrorComponent';
import MovePhaseBanner from './MovePhaseBanner';
import { selectBCState } from '../store/blockchainStateSlice';

const GameWrapper = () => {
    const dispatch = useAppDispatch();
    const gameState = useAppSelector(selectGameState);
    const gameRunningState = useAppSelector(selectGameRunningState)
    const pathLengths = useAppSelector(selectLengths)
    const error = useAppSelector(selectError);
    const blockchainState = useAppSelector(selectBCState);

    // TIMER
    const seconds = useAppSelector(selectSeconds)
    useEffect(() => {
        let myInterval = setInterval(() => {
            if (seconds > 0) {
                dispatch(setSeconds(seconds - 1));
            }
            if (seconds === 0) {
                clearInterval(myInterval)
            }
        }, 1000)
        return () => {
            clearInterval(myInterval);
        };
    });

    const colors = ['R', 'B', 'G', 'Y']

    if (error) return (
        <ErrorComponent />
    )

    if (gameRunningState == GameRunningState.RUNNING) return (
        <div className='glass' style={{ display: 'flex', flexDirection: 'column' }} >
            <MovePhaseBanner />
            <div style={{
                display: 'flex', flexDirection: 'row',
                width: `100%`,
                justifyContent: 'center'
            }}>
                <div style={{ width: 150, display: 'flex', flexDirection: 'column', backgroundColor: 'white', border: `3px solid black` }}>
                    {colors.map((color) => <div>{color}: {pathLengths[color]}</div>)}
                    <div>Cards in the deck: {gameState.deck.length}</div>
                    <div>SECONDS: <b>{seconds}</b></div>
                    <div>BC TYPE: <b>{blockchainState.blockchainType}</b></div>
                </div>
                <div>
                    <GameBoard />
                </div>
                <div>
                    <OponentsBanner />
                </div>
            </div>
        </div>
    )

    if (
        gameRunningState == GameRunningState.FINISHED ||
        gameRunningState == GameRunningState.FINISHED_AND_WAITING_FOR_FINALIZATION
    ) return (
        <div style={{ display: 'flex', width: `auto`, flexDirection: 'column', justifyContent: 'center' }}>
            <div>Game finished - gameRunningState: {gameRunningState}</div>
            <div>{JSON.stringify(blockchainState.gameResult)}</div>
            <button onClick={() => { dispatch(resetAll()) }}>OK, reset</button>
        </div>
    )

    return (
        <div>
            <div style={{
                position: 'absolute', width: `100%`,
                // minHeight: `100%`,
                top: 0, left: 0, right: 0, margin: 0, bottom: 'auto',
                overflowX: 'clip'
                // overflowX: 'hidden'
            }}>
                <ParallaxProvider>
                    <Background />
                </ParallaxProvider>
            </div>
            <div className='select-wrapper glass'>
                <div style={{ height: 100 }}></div>
                <GameSelect />
                <div style={{ height: 100 }}></div>
                <Description />
                <div style={{ height: 100 }}></div>
            </div>
        </div>
    )
}

export default GameWrapper;
