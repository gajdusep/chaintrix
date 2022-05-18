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
    setPlayerID, selectGameRunningState, selectLengths, GameRunningState, setGameFinishedNoBlockchain, setSocketError, selectError
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
import MovePhaseBanner from './MovePhaseBanner';

const GameWrapper = () => {
    const dispatch = useAppDispatch();
    const gameRunningState = useAppSelector(selectGameRunningState)
    const pathLengths = useAppSelector(selectLengths)
    const error = useAppSelector(selectError);

    // SOCKET
    // const socketConnected = useAppSelector(selectSocketConnected);

    // HEDERA VARS
    const hashConnectService = useAppSelector(selectHederaConnectService)
    const hederaStatus = useAppSelector(selectHederaStatus)

    useEffect(() => {
        // TODO: if hedera status == PAIRED..?

        console.log(`hedera status changed: ${hederaStatus}`)
        // dispatch(setUpHederaEvents())
        if (!hashConnectService) return;
        // dispatch(setUpHederaEvents())
        hashConnectService.hashconnect.foundExtensionEvent.on((data) => {
            console.log("Found extension", data);
            dispatch(addAvailableExtension({ data: data }))
        })
        hashConnectService.hashconnect.pairingEvent.on((data) => {
            if (hashConnectService == null) return;

            console.log("Paired with wallet", data);
            // console.log(`And after paired, the signer is: ${}`)
            // state.status = HashConnectStatus.PAIRED
            // setStatus(state.hashConnecteService?, HashConnectStatus.PAIRED)

            dispatch(setPairedData({ pairedWalletData: data.metadata, accountsIds: data.accountIds }))

            // TODO: save data in localstorage
            // saveDataInLocalstorage(hashconnectWrapper);
        });

    }, [hederaStatus])

    useEffect((): any => {
        const runHederaConnectEffect = async () => {
            dispatch(initHederaAsync())
        }
        runHederaConnectEffect()

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
        dispatch(setOnEvent({
            event: GAME_FINISHED_NO_BLOCKCHAIN, func: (payload: GameFinishedNoBlockchainPayload) => {
                dispatch(setGameFinishedNoBlockchain(payload))
            }
        }));
        dispatch(setOnEvent({
            event: SOCKET_ERROR, func: (payload) => {
                dispatch(setSocketError(payload))
            }
        }));
        // TODO: game finished - solana, hedera
        // socketClient.emit(PLAYER_WANTS_TO_PLAY_NO_BLOCKCHAIN, {});

    }, []);

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
                <div style={{ width: 100, display: 'flex', flexDirection: 'column', backgroundColor: 'white', border: `3px solid black` }}>
                    {colors.map((color) => <div>{color}: {pathLengths[color]}</div>)}
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

    if (gameRunningState == GameRunningState.FINISHED) return (
        <div style={{ display: 'flex', width: `100%`, justifyContent: 'center' }}>
            <div>Game finished</div>
        </div>
    )

    return (
        <>
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
        </>
    )
}

export default GameWrapper;
