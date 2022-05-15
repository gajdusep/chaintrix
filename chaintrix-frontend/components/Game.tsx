import styles from '../components/Hexagons.module.css'
import { useEffect, useState } from 'react';
import {
    GameState, PLAYER_PLAYED, GAME_STARTED, PlayerPlayedPayload,
    GameStartedPayload, PLAYER_WANTS_TO_PLAY_NO_BLOCKCHAIN,
    GAME_STARTED_PLAYER_ID, GameStartedPlayerIDPayload,
    PLAYER_WANTS_TO_PLAY_SOLANA, PlayerWantsToPlaySolanaPayload,
    GAME_FINISHED_NO_BLOCKCHAIN, GameFinishedNoBlockchainPayload, PlayerWantsToPlayHederaPayload, PLAYER_WANTS_TO_PLAY_HEDERA
} from '../../chaintrix-game-mechanics/dist/index.js';
// } from 'chaintrix-game-mechanics';
import { useAnchorWallet, useWallet, WalletProvider } from "@solana/wallet-adapter-react";
import { randomBytes, sign } from 'crypto';
import * as anchor from "@project-serum/anchor";
import { Program, Provider } from "@project-serum/anchor";
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { LOCALHOST_PROGRAM_ID, LOCALHOST_SOCKET_ENDPOINT, LOCALHOST_SOLANA_ENDPOINT } from '../helpers/Constants';
import { IDL } from "../types/chaintrix_solana";
import {
    selectGameState, setGameState, onPlayerPlayedSocketEvent,
    setPlayerID, selectPlayerID, selectGameRunningState, selectLengths, GameRunningState, setGameFinishedNoBlockchain
} from '../store/gameStateSlice';
import { selectSocketClient, setOnEvent } from '../store/socketSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import React from 'react'
import OponentsBanner from '../components/OponentsBanner';
import GameBoard from '../components/GameBoard';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
    Hbar, ContractCallQuery, ContractId, ContractFunctionParameters,
    ContractExecuteTransaction,
    AccountId,
    Client,
    AccountBalanceQuery
} from "@hashgraph/sdk";
import NodeClient from "@hashgraph/sdk/lib/client/NodeClient";
import { HashConnect, HashConnectTypes } from 'hashconnect';
import {
    sendTransaction, connectToExtension, HashConnectStatus
} from '../helpers/HashConnectService'
import web3 from 'web3'
import {
    selectHederaConnectService, selectHederaStatus,
    initHederaAsync, addAvailableExtension, setPairedData
} from '../store/hederaSlice';

const Game = () => {
    const gameState = useAppSelector(selectGameState);
    const socketClient = useAppSelector(selectSocketClient);
    const playerID = useAppSelector(selectPlayerID)
    const dispatch = useAppDispatch();
    const gameRunningState = useAppSelector(selectGameRunningState)
    const pathLengths = useAppSelector(selectLengths)

    // SOLANA VARS
    const wallet = useWallet();
    const anchorWallet = useAnchorWallet();
    const [connection, setConnection] = useState<Connection>(() => { return new Connection(LOCALHOST_SOLANA_ENDPOINT) })

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
        // TODO: game finished - solana, hedera
        // socketClient.emit(PLAYER_WANTS_TO_PLAY_NO_BLOCKCHAIN, {});

    }, []);

    const onPlayNoBCCLick = () => {
        socketClient.emit(PLAYER_WANTS_TO_PLAY_NO_BLOCKCHAIN, {});
    }

    const onPlaySolanaClick = async () => {
        // TODO: error text
        if (!socketClient) return;
        // TODO: error text
        if (!wallet || !wallet.publicKey || !anchorWallet) return;


        const provider = new anchor.AnchorProvider(connection, anchorWallet, {})
        const program = new Program(IDL, LOCALHOST_PROGRAM_ID, provider);

        console.log(`betting started ${wallet.publicKey}`)
        const seed = randomBytes(32);
        const [betAccountPDA, betAccountPDABump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("seed"), seed],
            program.programId
        );
        console.log(`bet accounts: ${betAccountPDA} ${betAccountPDABump}`)

        const player0 = anchor.web3.Keypair.generate();

        const tx = await program.methods.bet(betAccountPDABump, seed)
            .accounts({
                baseAccount: betAccountPDA,
                player: wallet.publicKey,
                // player: player0.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([])
            .rpc({ commitment: 'max' });
        // .rpc({});

        const pdaAccount = await program.account.betAccount.fetch(betAccountPDA);
        console.log(`pda account: ${JSON.stringify(pdaAccount)}, balance: ${await connection.getBalance(betAccountPDA)}`);

        // TODO: socket emit (wantstoplaysolana)
        const payload: PlayerWantsToPlaySolanaPayload = {
            betPDA: betAccountPDA.toBase58(),
            playerAddress: wallet.publicKey.toBase58()
        }
        socketClient.emit(PLAYER_WANTS_TO_PLAY_SOLANA, payload);
    }

    const onPlayHederaCLick = async () => {
        const contractId = new ContractId(34813188)
        if (!hashConnectService) return;
        const playerHederaIdStr = hashConnectService.savedData.pairedAccounts[0]
        const topic = hashConnectService.savedData.topic
        const playerHederaId = AccountId.fromString(playerHederaIdStr)
        console.log(`playerID: ${playerHederaIdStr}`)
        // TODO: provider correct this.
        const provider = hashConnectService.hashconnect.getProvider('testnet', topic, playerHederaIdStr);
        const signer = hashConnectService.hashconnect.getSigner(provider)

        const contractExecuteTx = await new ContractExecuteTransaction({ amount: Hbar.fromTinybars(777) })
            .setContractId(contractId)
            .setGas(1000000)
            .setFunction("bet", new ContractFunctionParameters().addAddress(playerHederaId.toSolidityAddress()))
            .freezeWithSigner(signer)

        console.log(`signer: ${signer.getAccountId().toString()}`)
        const response = await contractExecuteTx.executeWithSigner(signer);

        console.log(`response id: ${JSON.stringify(response.transactionId)} response hash: ${JSON.stringify(response.transactionHash)}`)
        const sec = response.transactionId.validStart?.seconds.low;
        const nano = response.transactionId.validStart?.nanos.low;
        const txId = `${playerHederaIdStr}@${sec}.${nano}`;
        const receipt = await provider.getTransactionReceipt(txId);
        console.log(`receipt: ${receipt.status}`)

        const payload: PlayerWantsToPlayHederaPayload = {
            playerAddress: playerHederaIdStr
        }
        socketClient.emit(PLAYER_WANTS_TO_PLAY_HEDERA, payload);

        return;
    }

    const connectToHederaWallet = async () => {
        if (!hashConnectService) return;
        await connectToExtension(hashConnectService);
    }

    const colors = ['R', 'B', 'G', 'Y']

    if (gameRunningState == GameRunningState.RUNNING) return (
        <div style={{ display: 'flex', width: `100%`, justifyContent: 'center' }}>
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
    )

    if (gameRunningState == GameRunningState.FINISHED) return (
        <div style={{ display: 'flex', width: `100%`, justifyContent: 'center' }}>
            <div>Game finished</div>
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: `400px`, justifyContent: 'center' }}>
            <div>
                <button className='basic-button' onClick={() => onPlayNoBCCLick()}>Play with no blockchain</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <WalletMultiButton />
                {wallet && anchorWallet ? <button onClick={() => onPlaySolanaClick()} className='basic-button'>Play with Solana</button> : <></>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <button onClick={() => { connectToHederaWallet() }} className='basic-button'>Connect to Hedera wallet</button>
                {hederaStatus == HashConnectStatus.PAIRED ? <button onClick={() => { onPlayHederaCLick() }} className='basic-button'>Play with Hedera</button> : <></>}
            </div>
        </div>
    )
}

export default Game;
