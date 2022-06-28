import { deploy } from "./deploy";
import { getConfig } from "./config";
import { ContractId, Hbar, HbarUnit } from "@hashgraph/sdk";
import {
    scCallBet, getContractBalance, scCallAcceptBets, closeGame,
    getHasPlayerPlacedBet, getOpponentAddress, getServerAddress, getPlayerBalance, getGames
} from "./hederaMethods";
import { BigNumber } from "@hashgraph/sdk/lib/Transfer";
import * as assert from "assert";
import { getChunks, getFileContents, uploadFileToHederaFS } from "./fileHederaMethods";

require("dotenv").config();


export const HEDERA_CONTRACT_ID = new ContractId(46033478);
const config = getConfig()
jest.setTimeout(50_000);

// let contractId = ContractId.fromString("0.0.35590667")
let contractId = null
const BET_AMOUNT = 5555
const TREASURY_ACCOUNT = config.player2Id.toSolidityAddress()
const TREASURY_AMOUNT = 500
const WRONG_BET_AMOUNT = 100
const MOCK_ADDRESS = '0000000000000000000000000000000000000000'

