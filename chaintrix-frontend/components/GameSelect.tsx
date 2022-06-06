import { useState } from 'react';
import {
    PLAYER_WANTS_TO_PLAY_NO_BLOCKCHAIN, PLAYER_WANTS_TO_PLAY_SOLANA, PlayerWantsToPlaySolanaPayload,
    PlayerWantsToPlayHederaPayload, PLAYER_WANTS_TO_PLAY_HEDERA,
    IDL,
    BlockchainType
} from '../../chaintrix-game-mechanics/dist/index.js';
// } from 'chaintrix-game-mechanics';
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { randomBytes } from 'crypto';
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Connection } from '@solana/web3.js';
import { HEDERA_CONTRACT_ID, LOCALHOST_PROGRAM_ID, LOCALHOST_SOLANA_ENDPOINT } from '../helpers/Constants';
import {
    selectGameRunningState, GameRunningState, setGameRunningState
} from '../store/gameStateSlice';
import { selectSocketClient } from '../store/socketSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import React from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Hbar, ContractFunctionParameters, ContractExecuteTransaction, AccountId } from "@hashgraph/sdk";
import { connectToExtension, HashConnectStatus } from '../helpers/HashConnectService'
import { selectHederaConnectService, selectHederaStatus } from '../store/hederaSlice';
import { setBlockchainType } from '../store/blockchainStateSlice';
import { ToastContainer, toast } from 'react-toastify';

const toastError = () => {
    toast.error('We are unable to make your bet work.', {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    });
}

const GameSelect = () => {
    const dispatch = useAppDispatch();
    const socketClient = useAppSelector(selectSocketClient);
    const gameRunningState = useAppSelector(selectGameRunningState)

    // SOLANA VARS
    const wallet = useWallet();
    const anchorWallet = useAnchorWallet();
    const [connection, setConnection] = useState<Connection>(() => { return new Connection(LOCALHOST_SOLANA_ENDPOINT) })

    // HEDERA VARS
    const hashConnectService = useAppSelector(selectHederaConnectService)
    const hederaStatus = useAppSelector(selectHederaStatus)

    const onPlayNoBCCLick = () => {
        dispatch(setBlockchainType(BlockchainType.NO_BLOCKCHAIN));
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

        dispatch(setGameRunningState(GameRunningState.BET_WAITING_FOR_BLOCKCHAIN_CONFIRMATION))

        try {
            const tx = await program.methods.bet(betAccountPDABump, seed)
                .accounts({
                    baseAccount: betAccountPDA,
                    player: wallet.publicKey,
                    // player: player0.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([])
                .rpc({ commitment: 'confirmed' });

            const pdaAccount = await program.account.betAccount.fetch(betAccountPDA);
            console.log(`pda account: ${JSON.stringify(pdaAccount)}, balance: ${await connection.getBalance(betAccountPDA)}`);
        } catch (error) {
            toastError()
            dispatch(setGameRunningState(GameRunningState.NOT_STARTED))
            return;
        }

        const payload: PlayerWantsToPlaySolanaPayload = {
            betPDA: betAccountPDA.toBase58(),
            playerAddress: wallet.publicKey.toBase58()
        }
        dispatch(setBlockchainType(BlockchainType.SOLANA));
        socketClient.emit(PLAYER_WANTS_TO_PLAY_SOLANA, payload);
    }

    const onPlayHederaCLick = async () => {
        if (!hashConnectService) return;
        const playerHederaIdStr = hashConnectService.savedData.pairedAccounts[0]
        const topic = hashConnectService.savedData.topic
        const playerHederaId = AccountId.fromString(playerHederaIdStr)
        console.log(`playerID: ${playerHederaIdStr}`)
        // TODO: provider correct this.
        const provider = hashConnectService.hashconnect.getProvider('testnet', topic, playerHederaIdStr);
        const signer = hashConnectService.hashconnect.getSigner(provider)

        dispatch(setGameRunningState(GameRunningState.BET_WAITING_FOR_BLOCKCHAIN_CONFIRMATION))
        const contractExecuteTx = await new ContractExecuteTransaction({ amount: Hbar.fromTinybars(5555) })
            .setContractId(HEDERA_CONTRACT_ID)
            .setGas(1000000)
            .setFunction("bet", new ContractFunctionParameters().addAddress(playerHederaId.toSolidityAddress()))
            .freezeWithSigner(signer)

        console.log(`signer: ${signer.getAccountId().toString()}`)
        const response = await contractExecuteTx.executeWithSigner(signer);

        if (!response) {
            toastError()
            dispatch(setGameRunningState(GameRunningState.NOT_STARTED))
            return;
        }

        // TODO: catch error
        console.log(`response id: ${JSON.stringify(response.transactionId)} response hash: ${JSON.stringify(response.transactionHash)}`)
        const sec = response.transactionId.validStart?.seconds.low;
        const nano = response.transactionId.validStart?.nanos.low;
        const txId = `${playerHederaIdStr}@${sec}.${nano}`;
        const receipt = await provider.getTransactionReceipt(txId);
        console.log(`receipt: ${receipt.status}`)

        const payload: PlayerWantsToPlayHederaPayload = {
            playerAddress: playerHederaIdStr
        }

        dispatch(setBlockchainType(BlockchainType.HEDERA));
        socketClient.emit(PLAYER_WANTS_TO_PLAY_HEDERA, payload);
    }

    const connectToHederaWallet = async () => {
        if (!hashConnectService) return;
        await connectToExtension(hashConnectService);
    }

    if (gameRunningState == GameRunningState.BET_WAITING_FOR_BLOCKCHAIN_CONFIRMATION) {
        return (
            <div>
                <h1 style={{ textAlign: 'center' }}>chaintrix</h1>
                <div>Please confirm your bet with your wallet and wait for the confirmation.</div>
            </div>
        )
    }

    if (gameRunningState == GameRunningState.BET_CONFIRMED_NOW_WAITING) {
        return (
            <div>
                <h1 style={{ textAlign: 'center' }}>chaintrix</h1>
                <div>Bet confirmed, waiting for oponents</div>
            </div>
        )
    }

    return (
        <div>
            {/* //  style={{ display: 'flex', flexDirection: 'column', width: `400px`, justifyContent: 'center' }} */}

            <h1 style={{ textAlign: 'center' }}>chaintrix</h1>
            <div>Begin with selecting your blockchain:</div>
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

export default GameSelect;
