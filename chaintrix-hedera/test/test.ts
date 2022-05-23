import { deploy } from "./deploy";
import { getConfig } from "./config";
import { ContractId } from "@hashgraph/sdk";
import { scCallBet, getBalance, scCallAcceptBets, getOponent, closeGame, getHasPlayerPlacedBet, getOpponentAddress, getServerAddress } from "./hederaMethods";
import * as assert from "assert";

// let contractId = ContractId.fromString("0.0.34889466")
let contractId = null

const config = getConfig()
jest.setTimeout(30000);
it("Contract can be deployed", async () => {
    if (contractId == null) {
        contractId = await deploy(config)
    }

    console.log(`ContractID: ${contractId}`)
})

it("Player can place bet", async () => {
    assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player0Id), false)
    await scCallBet(config.player0Client, config.player0Id, contractId)
    assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player0Id), true)
    await getBalance(config, contractId)
    // TODO: assert balance
    await scCallBet(config.player1Client, config.player1Id, contractId)
})

it("Player cannot place bet twice", async () => {
    await expect(scCallBet(config.player0Client, config.player0Id, contractId))
        .rejects.toThrow('CONTRACT_REVERT_EXECUTED')
})

it("Random account cannot accept bets", async () => {
    await expect(scCallAcceptBets(
        config.player0Client, config.player0Id.toSolidityAddress(), config.player1Id.toSolidityAddress(), contractId
    )).rejects.toThrow('CONTRACT_REVERT_EXECUTED')
})

it("Noone can accept bets with wrong parameters", async () => {
    // player is already playing

    // the same player
})

it("Server can accept bets", async () => {
    const res = await getServerAddress(config, contractId)
    console.log(`what: ${res}`)

    assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player0Id), true)
    assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player1Id), true)
    await scCallAcceptBets(
        config.serverClient, config.player0Id.toSolidityAddress(), config.player1Id.toSolidityAddress(), contractId
    )
    assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player0Id), false)
    assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player1Id), false)
    // TODO: assert oponent
    await getOponent(config, contractId)
})

it("Noone can accept bets after they were accepted", async () => {
    // console.log(`opponent address: ${await getOpponentAddress(config, contractId, config.player0Id)}`)
    // console.log(`opponent address: ${await getOpponentAddress(config, contractId, config.player1Id)}`)
    // await scCallAcceptBets(
    //     config.serverClient, config.player0Id.toSolidityAddress(), config.player1Id.toSolidityAddress(), contractId
    // )
    await expect(scCallAcceptBets(
        config.serverClient, config.player0Id.toSolidityAddress(), config.player1Id.toSolidityAddress(), contractId
    )).rejects.toThrow('CONTRACT_REVERT_EXECUTED')
    // await getOponent(config, contractId)
})

it("Random account cannot close the game", async () => {
    await expect(closeGame(
        config.player1Client, // wrong server
        config.player0Id, config.player0Client,
        config.player1Id, contractId
    )).rejects.toThrow('CONTRACT_REVERT_EXECUTED')
})

it("Nobody can close the game with incorrect parameters", async () => {
    // game that doesnt exist

    // the winner not one of the players

    // the players are not playing together
})

it("Server can close the game", async () => {
    // TODO asserts
    await closeGame(
        config.serverClient,
        config.player0Id, config.player0Client,
        config.player1Id, contractId
    )
    assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player0Id), false)
    await getOponent(config, contractId)
})

it("Nobody can close the game that is already closed", async () => {
    await expect(closeGame(
        config.serverClient,
        config.player0Id, config.player0Client,
        config.player1Id, contractId
    )).rejects.toThrow('CONTRACT_REVERT_EXECUTED')
})
