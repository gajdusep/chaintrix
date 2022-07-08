import { useEffect, useState } from 'react';
import { selectGameState, selectSizes, selectPlayerID, selectIsCurrentlyPlaying } from '../store/gameStateSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import React from 'react'
import styles from '../components/GameBoard.module.css'
import { mod } from 'chaintrix-game-mechanics';

const MovePhaseBanner = () => {
    const dispatch = useAppDispatch();
    const gameState = useAppSelector(selectGameState);
    const isCurrentlyPlaying = useAppSelector(selectIsCurrentlyPlaying);
    const [info, setInfo] = useState<String>("");
    const [infoWho, setInfoWho] = useState<String>("");
    const playerID = useAppSelector(selectPlayerID)

    const classByColorMapping: { [color: string]: string } = {
        'R': styles.redPlayer,
        'B': styles.bluePlayer,
        'G': styles.greenPlayer,
        'Y': styles.yellowPlayer,
    }

    const phaseDescriptionsPlaying = {
        0: "Phase 0: place obligatory cards!",
        1: "Phase 1: place one card!",
        2: "Phase 2: place obligatory cards!"
    }

    const phaseDescriptionsOpponent = {
        0: "Phase 0: obligatory move.",
        1: "Phase 1: free move.",
        2: "Phase 2: obligatory move."
    }

    useEffect(() => {
        if (isCurrentlyPlaying) {
            setInfoWho(`YOUR TURN! `)
            setInfo(phaseDescriptionsPlaying[gameState.currentlyMovingPhase])
        } else {
            setInfoWho(`Wait please, opponent's turn! `)
            setInfo(phaseDescriptionsOpponent[gameState.currentlyMovingPhase])
        }
    }, [isCurrentlyPlaying, gameState.currentlyMovingPhase])

    const getTextColor = () => {
        return isCurrentlyPlaying ? 'black' : 'grey'
    }
    const getRotation = () => {
        return isCurrentlyPlaying ? 'rotate(180deg)' : 'rotate(0deg)'
    }

    return (
        <div className='flex-row-center' style={{ textAlign: 'center', padding: 5 }}>
            <div style={{ fontSize: 'x-large', color: getTextColor() }}>{info}</div>
            <div style={{ flex: `1 auto` }}></div>
            <div style={{ marginRight: 0 }}>
                <div style={{ textAlign: 'center', padding: 10, display: 'flex', flexDirection: 'row' }}>
                    <div style={{ padding: `0 5px 0 5px`, margin: `0 5px 0 5px` }}
                        className={`rounded font-x-large ${classByColorMapping[gameState.playersStates[playerID].color]}`}>
                        {isCurrentlyPlaying && <b>YOU</b>}
                        {!isCurrentlyPlaying && <>YOU</>}
                    </div>
                    <img src='/others/arrow.png' height={40} style={{ transform: getRotation() }}></img>
                    <div style={{ padding: `0 5px 0 5px`, margin: `0 5px 0 5px` }}
                        className={`rounded font-x-large ${classByColorMapping[gameState.playersStates[mod(playerID + 1, 2)].color]}`}>
                        {!isCurrentlyPlaying && <b>Opponent</b>}
                        {isCurrentlyPlaying && <>Opponent</>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MovePhaseBanner;
