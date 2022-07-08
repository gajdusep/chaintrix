import React from 'react'
import HomePageLink from './HomePageLink';
const abiCoder = require("web3-eth-abi");

const Rules = () => {
    const imgSize = 400;
    return (
        <div style={{ maxWidth: `500px` }}>
            <div className='flex-column center-items select-wrapper glass'>
                <HomePageLink />
                <div style={{ height: 100 }}></div>
                <h1 style={{ textAlign: 'center' }}>Game rules</h1>
                <div>You will be playing against one opponent. Each one of you will be assigned a random color (blue, red, green or yellow).</div>
                <div>Your goal is to create the longest path possible for your color. If you create a loop, the length is multiplied by 2.</div>
                <img width={300} src='/rules/PathCalculation.png'></img>
                <div>Yellow: 5, Red: 2, Blue: 1, Green: 10 (5*2 because of the loop)</div>
                <div style={{ height: 50 }}></div>
                <h2>Position types</h2>
                <img width={imgSize} src='/rules/types.png'></img>
                <div><span style={{ color: '#6efe7d' }}><b>green</b></span> positions are free. You can place there a card in your free move.</div>
                <div><span style={{ color: '#ff7b66' }}><b>red</b></span> positions are guarded. You cannot place there a card unless the game is in the final stage (all tiles from the stack are dealt among players)</div>
                <div><span style={{ color: '#5d79f0' }}><b>dark blue</b></span> positions are obligatory. You must place a card if you have it.</div>
                <div><span style={{ color: '#8cf3f3' }}><b>light blue</b></span> positions are unrechable. You can never place any tile there.</div>
                <div style={{ height: 50 }}></div>
                <h2>Moves</h2>
                <div>Colors must always fit!</div>
                <img width={200} src='/rules/ColorsMustFit.png'></img>
                <div style={{ height: 50 }}></div>
                <div>You cannot place a card such that there are three paths of the same color leading to the obligatory position <b>unless the game is in the final stage.</b></div>
                <img width={200} src='/rules/ThreeSameColor.png'></img>
                <div style={{ height: 50 }}></div>
                <div>Your move has at least one phase, at most 3 phases.</div>
                <div>First, fill in all obligatory positions (obligatory position is blue, obligatory tiles are highlighted white), if you have any tiles that fit in them:</div>
                <img width={imgSize} src='/rules/0.gif'></img>
                <div style={{ height: 50 }}></div>
                <div>Second, play a card of your choice on any free position:</div>
                <img width={imgSize} src='/rules/1.gif'></img>
                <div style={{ height: 50 }}></div>
                <div>Third, if any obligatory position was created by your move and you have a card to place there, fill it:</div>
                <img width={imgSize} src='/rules/2.gif'></img>
                <div style={{ height: 50 }}></div>
                <h2>Final stage</h2>
                <div>The final stage starts when all cards from the deck are dealt among the players. Since that moment, there are NO guarded positions. Obligatory rules still hold (i.e. if you have an obligatory card, you must use it).</div>
                <div style={{ height: 100 }}></div>
            </div>
        </div>
    )
}

export default Rules;
