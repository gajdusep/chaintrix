import { useEffect, useState } from 'react';
import { selectGameState, selectSizes, selectPlayerID, selectIsCurrentlyPlaying } from '../store/gameStateSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import React from 'react'

const MovePhaseBanner = () => {
    const dispatch = useAppDispatch();
    const gameState = useAppSelector(selectGameState);
    const sizes = useAppSelector(selectSizes);
    const playerID = useAppSelector(selectPlayerID)
    const containerRef = React.useRef(null)
    const isCurrentlyPlaying = useAppSelector(selectIsCurrentlyPlaying);
    const [info, setInfo] = useState<String>("");
    const [infoWho, setInfoWho] = useState<String>("");

    const phaseDescriptionsPlaying = {
        0: "Phase 0: obligatory move. Place one of the highlighted cards.",
        1: "Phase 1: place one card where you want.",
        2: "Phase 2: obligatory move. Place one of the highlighted cards."
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

    return (
        <div style={{ textAlign: 'center', padding: 10, }}>
            <b>{infoWho}</b>
            <div>{info}</div>
        </div>
    )
}

export default MovePhaseBanner;
