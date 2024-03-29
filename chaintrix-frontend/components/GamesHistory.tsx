import { useState } from 'react';
import {
    IDL
} from 'chaintrix-game-mechanics';
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Connection } from '@solana/web3.js';
import { HEDERA_CONTRACT_ID, SOLANA_PROGRAM_ID, SOLANA_ENDPOINT, HEDERA_NETWORK } from '../helpers/Constants';
import { useAppSelector } from '../store/hooks';
import React from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Hbar, ContractExecuteTransaction, AccountId, ContractCallQuery, FileId, ContractFunctionParameters } from "@hashgraph/sdk";
import { connectToExtension, HashConnectStatus, sendTransaction } from '../store/hederaSlice'
import { selectHederaConnectService, selectHederaStatus } from '../store/hederaSlice';
import { Link } from 'react-router-dom';
import ClosedGameView from './ClosedGameView';
import { toastInfo } from '../helpers/ToastHelper';
import HomePageLink from './HomePageLink';
const abiCoder = require("web3-eth-abi");

export interface SolanaClosedGame {
    accountId: string,
    winnerIndex: number,
    player0: string,
    player1: string,
    arweave: string
}

const GamesHistory = () => {

    // SOLANA VARS
    const wallet = useWallet();
    const anchorWallet = useAnchorWallet();
    const [connection, setConnection] = useState<Connection>(() => { return new Connection(SOLANA_ENDPOINT) })

    // HEDERA VARS
    const hashConnectService = useAppSelector(selectHederaConnectService)
    const hederaStatus = useAppSelector(selectHederaStatus)

    const [solanaClosedGames, setSolanaClosedGames] = useState<Array<SolanaClosedGame>>(() => []);
    const [hederaClosedGames, setHederaClosedGames] = useState<Array<FileId>>(() => []);

    const onLoadAllSolana = async () => {
        if (!wallet || !wallet.publicKey || !anchorWallet) return;
        const provider = new anchor.AnchorProvider(connection, anchorWallet, {})
        const program = new Program(IDL, SOLANA_PROGRAM_ID, provider);
        const allBetAccounts = await program.account.betAccount.all()
        const allAccepted = await program.account.acceptedBetsAccount.all()
        const allClosedAccounts = await program.account.gameClosedAccount.all()
        console.log(`all bet: ${allBetAccounts.length}, all closed: ${allClosedAccounts.length}, all accepted: ${allAccepted.length}`)
        const newSolGames: Array<SolanaClosedGame> = allClosedAccounts.map(item => ({
            winnerIndex: item.account.winnerIndex,
            player0: item.account.player0.toString(),
            player1: item.account.player1.toString(),
            arweave: item.account.arweave,
            accountId: item.publicKey.toString()
        }))
        setSolanaClosedGames(newSolGames)
    }

    const load1 = async () => {
        if (!hashConnectService) return;
        const playerHederaIdStr = hashConnectService.savedData.pairedAccounts[0]
        const topic = hashConnectService.savedData.topic
        const playerHederaId = AccountId.fromString(playerHederaIdStr)
        console.log(`playerID: ${playerHederaIdStr}`)
        const provider = hashConnectService.hashconnect.getProvider(HEDERA_NETWORK, topic, playerHederaIdStr);
        const signer = hashConnectService.hashconnect.getSigner(provider)

        // LOGIC

        const contractExecuteTx = await new ContractExecuteTransaction()
            .setContractId(HEDERA_CONTRACT_ID)
            .setGas(1000000)
            .setFunction("getAll", undefined)
            .freezeWithSigner(signer)


        let transactionBytes: Uint8Array = await contractExecuteTx.toBytes();
        console.log(`sending transaction`)
        let res = await sendTransaction(hashConnectService, transactionBytes, playerHederaIdStr);
        console.log(`res: ${JSON.stringify(res.receipt)}`)
        console.log(`res: ${JSON.stringify(res)}`)
        const hexString1 = Buffer.from(res.receipt!).toString('hex');
        const decoded = abiCoder.decodeParameters(['address[]'], hexString1);
        console.log(decoded)
    }

    const load2 = async () => {
        if (!hashConnectService) return;
        const playerHederaIdStr = hashConnectService.savedData.pairedAccounts[0]
        const topic = hashConnectService.savedData.topic
        const playerHederaId = AccountId.fromString(playerHederaIdStr)
        console.log(`playerID: ${playerHederaIdStr}`)
        const provider = hashConnectService.hashconnect.getProvider(HEDERA_NETWORK, topic, playerHederaIdStr);
        const signer = hashConnectService.hashconnect.getSigner(provider)

        // LOGIC
        let contractQueryTx = new ContractCallQuery()
            .setContractId(HEDERA_CONTRACT_ID)
            // .setGas(5000000)
            .setGas((new Hbar(0.1)).toTinybars())
            .setFunction("getAll", null)
            .setQueryPayment(new Hbar(0.05))
        // .setMaxQueryPayment(new Hbar(1));
        // .setMaxQueryPayment(new Hbar(1));
        // .setQueryPayment(new Hbar(10));
        const contractQuerySubmit = await contractQueryTx.executeWithSigner(signer);

        const contractQueryResult = contractQuerySubmit.asBytes();
        console.log(`contractQueryResult: ${contractQueryResult}`)
        const hexString = Buffer.from(contractQueryResult).toString('hex');
        const result = abiCoder.decodeParameters(['address[]', 'uint256[]'], hexString);
        console.log(result)
    }

    const onLoadHederaGames = async () => {
        toastInfo("It is impossible to load Hedera history with HashConnect. Please, wait until a better wallet is implemented.")
        return
    }

    const connectToHederaWallet = async () => {
        if (!hashConnectService) return;
        await connectToExtension(hashConnectService);
    }

    return (
        <div style={{ maxWidth: `500px` }}>
            <div className='flex-column center-items select-wrapper glass'>
                <HomePageLink />
                <div style={{ height: 100 }}></div>
                <h1 style={{ textAlign: 'center' }}>Game history</h1>
                <h2>Solana game history</h2>
                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: `500px` }}>
                    <WalletMultiButton />
                    {wallet && anchorWallet ? <button onClick={() => onLoadAllSolana()} className='basic-button'>Load Solana game history</button> : <></>}
                    <div>
                        {solanaClosedGames.map((closedAccount) => {
                            return <ClosedGameView key={closedAccount.arweave} solanaGame={closedAccount} />
                        })}
                    </div>
                </div>
                <h2>Hedera game history</h2>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button onClick={() => { connectToHederaWallet() }} className='basic-button'>Connect to Hedera wallet</button>
                    {hederaStatus == HashConnectStatus.PAIRED ? <button onClick={() => { onLoadHederaGames() }} className='basic-button'>Load hedera games</button> : <></>}
                    {hederaClosedGames.map((closedGame) => {
                        return <div key={closedGame.toSolidityAddress()}>
                            <p>{closedGame.toString()}</p>
                        </div>
                    })}
                </div>
            </div>
        </div>
    )
}

export default GamesHistory;
