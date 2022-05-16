import { deploy } from "./deploy";
import { getConfig } from "./config";
import { ContractId } from "@hashgraph/sdk";
import { scCallBet, getBalance, scCallAcceptBets, getOponent, closeGame, getHasPlayerPlacedBet } from "./scCalls";
import * as assert from "assert";

const test = async (contractId: ContractId | null = null) => {
    const config = getConfig()
    if (!contractId) {
        contractId = await deploy(config)
    }

    console.log(contractId)
    try {
        // placing bets
        assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player0Id), false)
        await scCallBet(config.player0Client, config.player0Id, contractId)
        assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player0Id), true)

        await getBalance(config, contractId)
        await scCallBet(config.player1Client, config.player1Id, contractId)

        // accepting bets
        await scCallAcceptBets(config, contractId)
        assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player0Id), false)
        await getOponent(config, contractId)

        // closing game
        await closeGame(config, contractId)
        assert.equal(await getHasPlayerPlacedBet(config, contractId, config.player0Id), false)
    } catch (e) {
        console.log(e)
    }

}

// const contractId = ContractId.fromString("0.0.34274659")
// test(contractId)
test()
