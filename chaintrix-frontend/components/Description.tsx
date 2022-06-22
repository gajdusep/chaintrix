import React from 'react'

const Description = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div>Chaintrix is online blockchain version of the <a href='https://en.wikipedia.org/wiki/Tantrix' target="_blank" rel="noopener noreferrer">Tantrix</a> board game.</div>
            <h2>How does it work?</h2>
            <div>Play Tantrix with other online players.</div>
            <div>For learning, play without any bets. When you&apos;re confident enough, you can bet using Solana or Hedera tokens.</div>
            <h2>How does the betting work?</h2>
            <div>
                First, connect the wallet of the blockchain you want to use. For Solana, we recommed <a href='https://phantom.app/' target="_blank" rel="noopener noreferrer">Phantom</a>.
                For Hedera, use <a href='https://www.hashpack.app/' target="_blank" rel="noopener noreferrer">Hashpack</a>.
            </div>
            <h2>Rules of the game</h2>
            <div>You will be randomly assigned color. Make as long path as you can. If you do a loop, the final score will be multiplied by 2.</div>
        </div>
    );
}

export default Description;
