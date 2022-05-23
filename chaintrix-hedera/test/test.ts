import { deploy } from "./deploy";
import { getConfig } from "./config";
import { ContractId } from "@hashgraph/sdk";
import { scCallBet, getBalance, scCallAcceptBets, getOponent, closeGame, getHasPlayerPlacedBet } from "./scCalls";
import * as assert from "assert";

// let contractId = ContractId.fromString("0.0.34274659")
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

})

it("Random account cannot accept bets", async () => {

})

it("Server can accept bets", async () => {
    // TODO: change parameters in the following function
    await scCallAcceptBets(config, contractId)
    assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player0Id), false)
    // TODO: assert oponent
    await getOponent(config, contractId)
})

it("Random account cannot close the game", async () => {
})

it("Server can close the game", async () => {
    // TODO asserts
    await closeGame(config, contractId)
    assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player0Id), false)
})

