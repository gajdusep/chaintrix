import { useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import MovePhaseBanner from './MovePhaseBanner';
import { selectBCState } from '../store/blockchainStateSlice';
import GameFinished from './GameFinished';
import { toastError } from '../helpers/ToastHelper';
import GameInfoBanner from './GameInfoBanner';

const GameWrapper = () => {
    const dispatch = useAppDispatch();
    const gameRunningState = useAppSelector(selectGameRunningState)
    const error = useAppSelector(selectError);

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
                    <GameInfoBanner />
                    <GameBoard />
                    <OponentsBanner />
                </div>
            </div>
        </div>
    )

    return (
        <div style={{ maxWidth: `500px` }}>
            <div className='parallax-wrapper'>
                <ParallaxProvider>
                    <Background />
                </ParallaxProvider>
            </div>
            <div className='flex-column center-items select-wrapper glass'>
                <div style={{ height: 100 }}></div>
                <div className='chaintrix-heading'>chaintrix</div>
                <div style={{ height: 100 }}></div>
                <GameSelect />
                <div style={{ height: 100 }}></div>
                <Link to='/games' style={{ textDecoration: 'none' }}>
                    <div className='flex-column center-items'>
                        <img style={{ width: 300, }} src='/others/history.png' />
                        <div className='history-link-text'>history of matches</div>
                    </div>
                </Link>
                <div style={{ height: 100 }}></div>
                <Description />
                <div style={{ height: 100 }}></div>
            </div>
        </div >
    )
}

export default GameWrapper;
