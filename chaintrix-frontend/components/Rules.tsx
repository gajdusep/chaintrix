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
const abiCoder = require("web3-eth-abi");

const Rules = () => {
    const imgSize = 400;
    return (
        <div style={{ maxWidth: `500px` }}>
            <div className='flex-column center-items select-wrapper glass'>
                <Link to='/'>Homepage</Link>
                <div style={{ height: 100 }}></div>
                <h1 style={{ textAlign: 'center' }}>Game rules</h1>
                <div>You will be playing against one opponent. Each one of you will be assigned random color (blue, red, green or yellow).</div>
                <div>Your goal is to create longest path possible of your color.</div>
                <h2>Position types</h2>
                <img width={imgSize} src='/rules/types.png'></img>
                <div><span style={{ color: '#6efe7d' }}><b>green</b></span> positions are free. You can place there a card in your free move.</div>
                <div><span style={{ color: '#ff7b66' }}><b>red</b></span> positions are guarded. You cannot place there a card, unless the game is in the final stage (all tiles from stack are dealt among players)</div>
                <div><span style={{ color: '#5d79f0' }}><b>dark blue</b></span> positions are obligatory. You must place a card if you have it.</div>
                <div><span style={{ color: '#8cf3f3' }}><b>light blue</b></span> positions are unrechable. You can never place any tile there.</div>
                <h2>Moves</h2>
                <div>Your move has at least one phase, at most 3 phases. </div>
                <div>First, fill in all obligatory positions (obligatory position is blue, obligatory tiles are highlighted white), if you have any tiles that fit in them:</div>
                <img width={imgSize} src='/rules/0.gif'></img>
                <div style={{ height: 50 }}></div>
                <div>Second, play card of your choice on any free position:</div>
                <img width={imgSize} src='/rules/1.gif'></img>
                <div style={{ height: 50 }}></div>
                <div>Third, if any obligatory position was created by your move and you have card to place there, fill it:</div>
                <img width={imgSize} src='/rules/2.gif'></img>
                <h2>Final stage</h2>
            </div>
        </div>
    )
}

export default Rules;
