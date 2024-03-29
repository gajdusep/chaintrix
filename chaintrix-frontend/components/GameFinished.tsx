import { useEffect, useState } from 'react';
import {
    selectGameRunningState, resetAll, GameRunningState, selectGameState, selectPlayerID,
} from '../store/gameStateSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import React from 'react'
import { selectBCState } from '../store/blockchainStateSlice';
import {
    mod, ITS_A_DRAW_CONSTANT
} from 'chaintrix-game-mechanics';

const GameFinished = () => {
    const dispatch = useAppDispatch();
    const gameRunningState = useAppSelector(selectGameRunningState)
    const blockchainState = useAppSelector(selectBCState);
    const playerID = useAppSelector(selectPlayerID);
    return (
        <div className='finished-wrapper'>
            <div className='inner-finished-wrapper'>
                <div className='flex-column center-items rounded margin-padding' style={{ color: 'white', backgroundColor: 'rgba(52, 52, 52, 0.9)' }}>
                    {blockchainState.gameResult != null &&
                        <div className='font-x-large'>
                            {blockchainState.gameResult.winnerIndex == playerID &&
                                <div>YOU WON!</div>
                            }
                            {blockchainState.gameResult.winnerIndex == mod(playerID + 1, 2) &&
                                <div>You lost...</div>
                            }
                            {blockchainState.gameResult.winnerIndex == ITS_A_DRAW_CONSTANT &&
                                <div>It is a draw!</div>
                            }
                        </div>
                    }
                    {/* <div>Game finished - gameRunningState: {gameRunningState}</div> */}
                    <div>{blockchainState.gameResult?.gameClosedReason}</div>
                    {gameRunningState == GameRunningState.FINISHED_AND_WAITING_FOR_FINALIZATION &&
                        <div className='flex-column center-items center-text'>
                            <div>We are finalizing transactions on blockchain. If this operation takes too long, feel free to leave this page.</div>
                            <div className='lds-ring lds-ring-blue-color'><div></div><div></div><div></div><div></div></div>
                        </div>
                    }
                    <button className='basic-button' onClick={() => { dispatch(resetAll()) }}>OK, reset</button>
                </div>
            </div>
        </div>
    )
}

export default GameFinished;
