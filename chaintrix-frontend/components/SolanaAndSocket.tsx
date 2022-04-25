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

type SolanaAndSocketProps = {
}

const SolanaAndSocket = (
    props: SolanaAndSocketProps
) => {
    // SOCKET STUFF
    const [response, setResponse] = useState("");
    const [gameState, setGameState] = useState("");
    // const ENDPOINT = ;
    const [socket, setSocket] = useState<null | Socket>(null);

    useEffect((): any => {
        const socketClient = socketIOClient(LOCALHOST_SOCKET_ENDPOINT);
        socketClient.on("FromAPI", data => {
            setResponse(data);
        });
        socketClient.on("joinedOrCreated", data => {
            // setResponse(JSON.stringify(data));
        });
        socketClient.on("gameStarted", data => {
            setGameState('game was started')
        });
        socketClient.on("playerPlayed", data => {
            setGameState(data)
        });
        socketClient.on("gameSuccesfullyFinished", data => {
            setGameState('game was succesfully finished')
        });

        setSocket(socketClient)

        return () => socketClient.disconnect();
    }, []);

    // TODO: try catch
    const joinRoomClick = async () => {
        // TODO: error text
        if (!socket) return;
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

        socket.emit('wantsToPlay', betAccountPDA, wallet.publicKey);
    }

    const playYourRound = () => {
        if (!socket) return;

        socket.emit('playersTurn');
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
            <p>game state: {gameState}</p>
            <button onClick={playYourRound}>Play your round</button>
        </div>

    )
}

export default SolanaAndSocket;
