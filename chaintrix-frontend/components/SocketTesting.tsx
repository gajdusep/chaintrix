import React, { useState, useEffect } from 'react'
import socketIOClient, { Socket } from "socket.io-client";

type SocketTestingProps = {
}

const SocketTesting = (
    props: SocketTestingProps
) => {
    const [response, setResponse] = useState("");
    const [gameState, setGameState] = useState("");
    const ENDPOINT = "http://127.0.0.1:4001";
    const [socket, setSocket] = useState<null | Socket>(null);
    useEffect((): any => {
        const socketClient = socketIOClient(ENDPOINT);
        socketClient.on("FromAPI", data => {
            setResponse(data);
        });
        socketClient.on("joinedOrCreated", data => {
            setResponse(JSON.stringify(data));
        });
        socketClient.on("gameStarted", data => {
            setGameState('game was started')
        });
        socketClient.on("playerPlayed", data => {
            setGameState(data)
        });

        setSocket(socketClient)

        return () => socketClient.disconnect();
    }, []);

    const joinRoomClick = () => {
        if (!socket) return;

        socket.emit('wantsToPlay');
    }

    const playYourRound = () => {
        if (!socket) return;

        socket.emit('playersTurn');
    }

    return (
        <div className="box" style={{
            height: '500px', width: '500px', position: 'relative',
            overflow: 'hidden', padding: '0', backgroundColor: '#ffffaf'
        }}>
            {/* <p>It's <time dateTime={response}>{response}</time></p> */}
            <button onClick={joinRoomClick}>Join room or create a new one</button>
            <p>response: {response}</p>
            <p>game state: {gameState}</p>
            <button onClick={playYourRound}>Play your round</button>
        </div>

    )
}

export default SocketTesting;
