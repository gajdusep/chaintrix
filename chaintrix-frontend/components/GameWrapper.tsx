import { useEffect, useState } from 'react';
import {
    selectGameRunningState, selectLengths, GameRunningState,
    selectError, selectGameState, selectSeconds, setSeconds
} from '../store/gameStateSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import React from 'react'
import OponentsBanner from './OponentsBanner';
import GameBoard from './GameBoard';
import GameSelect from './GameSelect';
import Description from './Description';
import { ParallaxProvider } from 'react-scroll-parallax';
import Background from './Background';
import ErrorComponent from './ErrorComponent';
import MovePhaseBanner from './MovePhaseBanner';
import { selectBCState } from '../store/blockchainStateSlice';
import GameFinished from './GameFinished';
import { toastError } from '../helpers/ToastHelper';

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

    useEffect(() => {
        if (error != null) {
            toastError(error)
        }
    }, [error])

    const colors = ['R', 'B', 'G', 'Y']

    const isGameFinished = (): boolean => {
        return gameRunningState == GameRunningState.FINISHED ||
            gameRunningState == GameRunningState.FINISHED_AND_WAITING_FOR_FINALIZATION;
    }
    const isGameRunning = (): boolean => { return gameRunningState == GameRunningState.RUNNING }
    if (isGameRunning() || isGameFinished()) return (
        <div>
            {isGameFinished() && <GameFinished />}
            <div className='glass flex-column' style={{ position: 'relative' }}>
                {isGameRunning() && <MovePhaseBanner />}
                <div className='game-board-wrapper'>
                    <div className='flex-column' style={{ width: 150, backgroundColor: 'white', border: `3px solid black` }}>
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
        </div>
    )

    return (
        <div>
            <div className='parallax-wrapper'>
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
