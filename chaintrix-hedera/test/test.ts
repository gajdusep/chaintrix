import { deploy } from "./deploy";
import { getConfig } from "./config";
import { ContractId, Hbar, HbarUnit } from "@hashgraph/sdk";
import {
    scCallBet, getContractBalance, scCallAcceptBets, closeGame,
    getHasPlayerPlacedBet, getOpponentAddress, getServerAddress, getPlayerBalance, getGames, closeBet
} from "./hederaMethods";
import { BigNumber } from "@hashgraph/sdk/lib/Transfer";
import * as assert from "assert";
import { getChunks, getFileContents, uploadFileToHederaFS } from "./fileHederaMethods";

const config = getConfig()
jest.setTimeout(50_000);

// let contractId = ContractId.fromString("0.0.35590667")
let contractId = null
const BET_AMOUNT = 5555
const TREASURY_ACCOUNT = config.player2Id
const TREASURY_AMOUNT = 500
const WRONG_BET_AMOUNT = 100
const MOCK_ADDRESS = '0000000000000000000000000000000000000000'
const MOCK_CONTENTS = JSON.stringify({ "moves": ["move1", "move2"] })
const MOCK_CHUNKS = getChunks(Buffer.from(MOCK_CONTENTS, 'utf-8'), 5000)

const assertHbarDiff = (bigger: Hbar, smaller: Hbar, expected: number) => {
    const biggerTiny = bigger.toBigNumber()
    const smallerTiny = smaller.toBigNumber()
    const div = biggerTiny.minus(smallerTiny).multipliedBy((new Hbar(1)).toTinybars())
    assert.equal(div, expected)
}

const assertContractBalance = async (expectedBalance: number) => {
    assert.equal(await getContractBalance(contractId, config.serverClient), expectedBalance)
}

it("Contract can be deployed", async () => {
    if (contractId == null) {
        contractId = await deploy(config, BET_AMOUNT, TREASURY_AMOUNT, TREASURY_ACCOUNT.toSolidityAddress())
    }

    console.log(`ContractID: ${contractId}`)
})

it("Player cannot place bet with wrong params", async () => {
    // not enough was bet
    await expect(
        scCallBet(config.player0Client, config.player0Id, contractId, WRONG_BET_AMOUNT)
    ).rejects.toThrow('CONTRACT_REVERT_EXECUTED')
})

it("Player can place bet", async () => {
    assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player0Id), false)
    await scCallBet(config.player0Client, config.player0Id, contractId, BET_AMOUNT)
    assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player0Id), true)
    await assertContractBalance(BET_AMOUNT)

    await scCallBet(config.player1Client, config.player1Id, contractId, BET_AMOUNT)
    assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player1Id), true)
    await assertContractBalance(BET_AMOUNT * 2)
})

it("Server can close player's bet", async () => {
    await closeBet(config.serverClient, config.player0Id, contractId)
    await assertContractBalance(BET_AMOUNT)
})

it("Server cannot close bet that was closed", async () => {
    await expect(
        closeBet(config.serverClient, config.player0Id, contractId)
    ).rejects.toThrow('CONTRACT_REVERT_EXECUTED')
    await assertContractBalance(BET_AMOUNT)
})

it("Player can bet again after account was closed", async () => {
    await scCallBet(config.player0Client, config.player0Id, contractId, BET_AMOUNT)
    await assertContractBalance(BET_AMOUNT * 2)
})

it("Player cannot place bet twice", async () => {
    await expect(
        scCallBet(config.player0Client, config.player0Id, contractId, BET_AMOUNT)
    ).rejects.toThrow('CONTRACT_REVERT_EXECUTED')
})

it("Random account cannot accept bets", async () => {
    await expect(
        scCallAcceptBets(config.player0Client, config.player0Id.toSolidityAddress(), config.player1Id.toSolidityAddress(), contractId)
    ).rejects.toThrow('CONTRACT_REVERT_EXECUTED')
})

it("Noone can accept bets with wrong parameters", async () => {
    // the same player
    await expect(
        scCallAcceptBets(config.serverClient, config.player0Id.toSolidityAddress(), config.player0Id.toSolidityAddress(), contractId)
    ).rejects.toThrow('CONTRACT_REVERT_EXECUTED')
})

it("Server can accept bets", async () => {
    await scCallAcceptBets(
        config.serverClient, config.player0Id.toSolidityAddress(), config.player1Id.toSolidityAddress(), contractId
    )
    assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player0Id), false)
    assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player1Id), false)

    const opponent0 = await getOpponentAddress(contractId, config.player0Id, config.serverClient)
    const opponent1 = await getOpponentAddress(contractId, config.player1Id, config.serverClient)
    assert.equal(config.player1Id.toSolidityAddress(), opponent0.toSolidityAddress())
    assert.equal(config.player0Id.toSolidityAddress(), opponent1.toSolidityAddress())
})

it("Illegal actions when playing", async () => {
    // player tries to bet when playing
    await expect(
        scCallBet(config.player0Client, config.player0Id, contractId, BET_AMOUNT)
    ).rejects.toThrow('CONTRACT_REVERT_EXECUTED')

    // noone can accept bets after they were accepted
    await expect(
        scCallAcceptBets(config.serverClient, config.player0Id.toSolidityAddress(), config.player1Id.toSolidityAddress(), contractId)
    ).rejects.toThrow('CONTRACT_REVERT_EXECUTED')
})

it("Random account cannot close the game", async () => {
    await expect(
        closeGame(
            config.player1Client, // wrong server
            config.player0Id, config.player1Id, 0, contractId, MOCK_ADDRESS
        )
    ).rejects.toThrow('CONTRACT_REVERT_EXECUTED')
})

it("Nobody can close the game with incorrect parameters", async () => {
    // game that doesn't exist - players don't play together
    await expect(
        closeGame(
            config.player1Client, // wrong server
            config.player0Id, config.player2Id, 0, contractId, MOCK_ADDRESS
        )
    ).rejects.toThrow('CONTRACT_REVERT_EXECUTED')
})

it("Server can close the game", async () => {
    // mock data uploaded to file on Hedera
    const fileId = await uploadFileToHederaFS(config.serverPrivateKey, config.serverClient, MOCK_CHUNKS)
    const contentsCheck = await getFileContents(fileId, config.serverClient)
    assert.equal(MOCK_CONTENTS, contentsCheck)

    const pl0BalanceBefore = await getPlayerBalance(config.player0Id, config.serverClient)
    const pl1BalanceBefore = await getPlayerBalance(config.player1Id, config.serverClient)
    const treasuryBalanceBefore = await getPlayerBalance(TREASURY_ACCOUNT, config.serverClient)

    // close the game part
    const winnerIndex = 0
    await closeGame(
        config.serverClient, config.player0Id, config.player1Id, winnerIndex, contractId,
        fileId.toSolidityAddress()
    )
    await assertContractBalance(0)
    const pl0BalanceAfter = await getPlayerBalance(config.player0Id, config.serverClient)
    const pl1BalanceAfter = await getPlayerBalance(config.player1Id, config.serverClient)
    const treasuryBalanceAfter = await getPlayerBalance(TREASURY_ACCOUNT, config.serverClient)

    assertHbarDiff(treasuryBalanceAfter, treasuryBalanceBefore, TREASURY_AMOUNT)
    assertHbarDiff(pl0BalanceAfter, pl0BalanceBefore, BET_AMOUNT * 2 - TREASURY_AMOUNT)
    assert.equal(pl1BalanceBefore.toString(HbarUnit.Tinybar), pl1BalanceAfter.toString(HbarUnit.Tinybar))
    assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player0Id), false)

    // check the game file
    // const gameFileIds = await getGames(config.player0Client, contractId)
    const gameFileIds = await getGames(config, contractId)

    assert.equal(gameFileIds[0].toSolidityAddress(), fileId.toSolidityAddress())
})

it("Nobody can close the game that is already closed", async () => {
    await expect(closeGame(
        config.serverClient,
        config.player0Id, config.player1Id, 0,
        contractId, MOCK_ADDRESS
    )).rejects.toThrow('CONTRACT_REVERT_EXECUTED')
})

it("Draw scenario", async () => {
    await scCallBet(config.player0Client, config.player0Id, contractId, BET_AMOUNT)
    await scCallBet(config.player2Client, config.player2Id, contractId, BET_AMOUNT)
    await scCallAcceptBets(
        config.serverClient, config.player0Id.toSolidityAddress(), config.player2Id.toSolidityAddress(), contractId
    )
    const winnerIndex = 255
    const fileId = await uploadFileToHederaFS(config.serverPrivateKey, config.serverClient, MOCK_CHUNKS)
    await closeGame(
        config.serverClient, config.player0Id, config.player2Id, winnerIndex, contractId,
        fileId.toSolidityAddress()
    )
    const gameFileIds = await getGames(config, contractId)
    assert.equal(gameFileIds[1].toSolidityAddress(), fileId.toSolidityAddress())
})
