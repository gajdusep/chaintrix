import React, { useState, useEffect } from 'react'
import socketIOClient, { Socket } from "socket.io-client";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAnchorWallet, useWallet, WalletProvider } from "@solana/wallet-adapter-react";
import { randomBytes } from 'crypto';
import * as anchor from "@project-serum/anchor";
import { Program, Provider } from "@project-serum/anchor";
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { IDL } from "../types/chaintrix_solana";
import { LOCALHOST_PROGRAM_ID, LOCALHOST_SOCKET_ENDPOINT, LOCALHOST_SOLANA_ENDPOINT } from '../helpers/Constants';
import { GameState, MoveInfo } from '../../chaintrix-game-mechanics/dist';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
    selectSocketClient, setOnEvent
} from '../store/socketSlice';

type SolanaAndSocketProps = {
}

const SolanaAndSocket = (
    props: SolanaAndSocketProps
) => {
    // SOCKET STUFF
    const [response, setResponse] = useState("");
    // const [gameState, setGameState] = useState("");
    const [socketText, setsocketText] = useState("");
    const [gameState, setGameState] = useState<GameState>();
    // const ENDPOINT = ;
    // const [socket, setSocket] = useState<null | Socket>(null);
    const socketClient = useAppSelector(selectSocketClient);
    const dispatch = useAppDispatch();

    useEffect((): any => {
        dispatch(setOnEvent({
            event: 'FromAPI', func: (data) => {
                setResponse(data);
            }
        }))
        dispatch(setOnEvent({
            event: 'joinedOrCreated', func: (data) => {
                // setResponse(JSON.stringify(data));
            }
        }))
        dispatch(setOnEvent({
            event: 'gameStarted', func: (newGameState: GameState) => {
                setGameState(newGameState)
                setsocketText(`game was started ${JSON.stringify(newGameState.playersStates)}`)
            }
        }))
        dispatch(setOnEvent({
            event: 'playerPlayed', func: (data) => {
                setsocketText(data)
            }
        }))
        dispatch(setOnEvent({
            event: 'gameSuccesfullyFinished', func: data => {
                setsocketText('game was succesfully finished')
            }
        }))
    }, []);

    // TODO: try catch
    const joinRoomClick = async () => {
        // TODO: error text
        if (!socketClient) return;
        // TODO: error text
        if (!wallet || !wallet.publicKey) return;

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
        console.log(`pda account: ${pdaAccount}`);
        setResponse(`${betAccountPDA.toBase58()} with balance: ${await connection.getBalance(betAccountPDA)}`);

        socketClient.emit('wantsToPlay', betAccountPDA, wallet.publicKey);
    }

    const playYourRound = () => {
        if (!socketClient) return;
        if (!gameState) return;

        const moveInfo: MoveInfo = {
            card: gameState.playersStates[gameState.currentlyMovingPlayer].cards[0],
            x: 1,
            y: 1
        }
        socketClient.emit('playersTurn', moveInfo);
    }

    // SOLANA STUFF
    const wallet = useWallet();
    console.log(wallet.publicKey?.toBase58())
    const anchorWallet = useAnchorWallet();
    console.log(anchorWallet?.publicKey.toBase58())
    const connection = new Connection(LOCALHOST_SOLANA_ENDPOINT)
    if (!wallet || !anchorWallet) return <WalletMultiButton />;
    const provider = new anchor.AnchorProvider(connection, anchorWallet, {})
    // const program = new Program(IDL, "92yF4jyrw62mWmUW7pvXa6XuaNx7ZCmshpwsK1gdgsrv", provider);
    const program = new Program(IDL, LOCALHOST_PROGRAM_ID, provider);

    return (
        <div className="box" style={{
            height: '500px', width: '500px', position: 'relative',
            overflow: 'hidden', padding: '0', backgroundColor: '#ffffaf'
        }}>
            <WalletMultiButton />
            {/* <p>It's <time dateTime={response}>{response}</time></p> */}
            <button onClick={joinRoomClick}>Join room or create a new one</button>
            <p>response: {response}</p>
            <p>game state: {socketText}</p>
            <button onClick={playYourRound}>Play your round</button>
        </div>

    )
}

export default SolanaAndSocket;
