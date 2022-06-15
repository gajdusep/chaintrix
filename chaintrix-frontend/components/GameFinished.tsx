import { useEffect, useState } from 'react';
import {
    selectGameRunningState, resetAll, GameRunningState,
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
                {gameRunningState == GameRunningState.FINISHED_AND_WAITING_FOR_FINALIZATION &&
                    <div className='flex-column center-items center-text'>
                        <div>We are finalizing transactions on blockchain. If this operation takes too long, feel free to leave this page.</div>
                        <div className='lds-ring lds-ring-blue-color'><div></div><div></div><div></div><div></div></div>
                    </div>
                }
                <button className='basic-button' onClick={() => { dispatch(resetAll()) }}>OK, reset</button>
            </div>
        </div>
    )
}

export default GameFinished;
