import { useState } from 'react';
import {
    PLAYER_WANTS_TO_PLAY_NO_BLOCKCHAIN, PLAYER_WANTS_TO_PLAY_SOLANA, PlayerWantsToPlaySolanaPayload,
    PlayerWantsToPlayHederaPayload, PLAYER_WANTS_TO_PLAY_HEDERA,
    IDL,
    ChaintrixSolana
} from '../../chaintrix-game-mechanics/dist/index.js';
// } from 'chaintrix-game-mechanics';
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { randomBytes } from 'crypto';
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Connection } from '@solana/web3.js';
import { HEDERA_CONTRACT_ID, LOCALHOST_PROGRAM_ID, LOCALHOST_SOLANA_ENDPOINT } from '../helpers/Constants';
import {
    selectGameState, selectPlayerID, selectGameRunningState, selectLengths,
    selectError
} from '../store/gameStateSlice';
import { selectSocketClient } from '../store/socketSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import React from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Hbar, ContractFunctionParameters, ContractExecuteTransaction, AccountId } from "@hashgraph/sdk";
import { connectToExtension, HashConnectStatus } from '../helpers/HashConnectService'
import { selectHederaConnectService, selectHederaStatus } from '../store/hederaSlice';
import { Link } from 'react-router-dom';

const GamesHistory = () => {

    // SOLANA VARS
    const wallet = useWallet();
    const anchorWallet = useAnchorWallet();
    const [connection, setConnection] = useState<Connection>(() => { return new Connection(LOCALHOST_SOLANA_ENDPOINT) })

    // HEDERA VARS
    const hashConnectService = useAppSelector(selectHederaConnectService)
    const hederaStatus = useAppSelector(selectHederaStatus)

    const [closedAccounts, setClosedAccounts] = useState<Array<any>>(() => []);

    const onLoadAllSolana = async () => {
        if (!wallet || !wallet.publicKey || !anchorWallet) return;
        const provider = new anchor.AnchorProvider(connection, anchorWallet, {})
        const program = new Program(IDL, LOCALHOST_PROGRAM_ID, provider);
        const allBetAccounts = await program.account.betAccount.all()
        const allAccepted = await program.account.acceptedBetsAccount.all()
        const allClosedAccounts = await program.account.gameClosedAccount.all()
        console.log(`all bet: ${allBetAccounts.length}, all closed: ${allClosedAccounts.length}, all accepted: ${allAccepted.length}`)
        setClosedAccounts(allClosedAccounts)
    }

    const onPlayHederaCLick = async () => {
        if (!hashConnectService) return;
        const playerHederaIdStr = hashConnectService.savedData.pairedAccounts[0]
        const topic = hashConnectService.savedData.topic
        const playerHederaId = AccountId.fromString(playerHederaIdStr)
        console.log(`playerID: ${playerHederaIdStr}`)

        const provider = hashConnectService.hashconnect.getProvider('testnet', topic, playerHederaIdStr);
        const signer = hashConnectService.hashconnect.getSigner(provider)
        return;
    }

    const connectToHederaWallet = async () => {
        if (!hashConnectService) return;
        await connectToExtension(hashConnectService);
    }

    return (
        <div
        //  style={{ display: 'flex', flexDirection: 'column', width: `400px`, justifyContent: 'center' }}
        >
            <Link to='/'>Homepage</Link>
            <h1 style={{ textAlign: 'center' }}>Game history</h1>
            <h2>Solana game history</h2>
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: `500px` }}>
                <WalletMultiButton />
                {wallet && anchorWallet ? <button onClick={() => onLoadAllSolana()} className='basic-button'>Load and write to console</button> : <></>}
                {closedAccounts.map((closedAccount) => {
                    return <div key={closedAccount.account.arweave}>
                        <a target="_blank" rel="noopener noreferrer" href={`https://arweave.net/${closedAccount.account.arweave}`}>{closedAccount.account.arweave}</a>
                        <p>{closedAccount.account.winnerIndex}</p>
                        <p>{JSON.stringify(closedAccount.account.player0)}</p>
                    </div>
                })}
            </div>
            <h2>Hedera game history</h2>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <button onClick={() => { connectToHederaWallet() }} className='basic-button'>Connect to Hedera wallet</button>
                {hederaStatus == HashConnectStatus.PAIRED ? <button onClick={() => { onPlayHederaCLick() }} className='basic-button'>Play with Hedera</button> : <></>}
            </div>
        </div>

    )
}

export default GamesHistory;
