import { useEffect, useState } from 'react';
import {
    selectGameRunningState, resetAll,
} from '../store/gameStateSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import React from 'react'
import { selectBCState } from '../store/blockchainStateSlice';

const GameFinished = () => {
    const dispatch = useAppDispatch();
    const gameRunningState = useAppSelector(selectGameRunningState)
    const blockchainState = useAppSelector(selectBCState);
    return (
        <div className='finished-wrapper'>
            <div className='inner-finished-wrapper'>
                <div>Game finished - gameRunningState: {gameRunningState}</div>
                <div>{JSON.stringify(blockchainState.gameResult)}</div>
                <button className='basic-button' onClick={() => { dispatch(resetAll()) }}>OK, reset</button>
            </div>
        </div>
    )
}

export default GameFinished;
