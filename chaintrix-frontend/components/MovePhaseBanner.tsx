import { useEffect, useState } from 'react';
import {
    GameState, PLAYER_PLAYED, GAME_STARTED, PlayerPlayedPayload,
    GAME_STARTED_PLAYER_ID, GameStartedPlayerIDPayload,
    GAME_FINISHED_NO_BLOCKCHAIN, GameFinishedNoBlockchainPayload,
    SOCKET_ERROR
} from '../../chaintrix-game-mechanics/dist/index.js';
// } from 'chaintrix-game-mechanics';
import {
    setGameState, onPlayerPlayedSocketEvent,
    setPlayerID, selectGameRunningState, selectLengths, GameRunningState, setGameFinishedNoBlockchain, setSocketError, selectError, selectGameState, selectSizes, selectPlayerID, selectIsCurrentlyPlaying
} from '../store/gameStateSlice';
import { selectSocketConnected, setOnEvent } from '../store/socketSlice';
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
            <b>{infoWho}</b>{info}
        </div>
    )
}

export default MovePhaseBanner;
