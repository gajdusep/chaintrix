import React from 'react'
import { ParallaxProvider, useParallax } from 'react-scroll-parallax';

const Description = () => {

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div>Chaintrix is online version of board game <a href='https://en.wikipedia.org/wiki/Tantrix'>Tantrix</a></div>
            <h2>How does it work?</h2>
            <div>Play Tantrix with other online players.</div>
            <div>For learning, you can play without any bets. When you're confident enough, you can bet using Solana or Hedera tokens.</div>
            <h2>How does the betting work?</h2>
            <div>First, connect the wallet of the blockchain you want to use. For Solana, we recommed Phantom. For Hedera, use Hashconnect.</div>
            <div>First, connect the wallet of the blockchain you want to use.</div>
        </div>
    );
}

export default Description;
