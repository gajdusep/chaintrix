import { deploy } from "./deploy";
import { getConfig } from "./config";
import { ContractId } from "@hashgraph/sdk";
import { scCallBet, getBalance, scCallAcceptBets, getOponent, closeGame } from "./scCalls";

const test = async (contractId: ContractId | null = null) => {
    const config = getConfig()
    if (!contractId) {
        contractId = await deploy(config)
    }

    console.log(contractId)
    try {
        await scCallBet(config.player0Client, config.player0Id, contractId)
        await getBalance(config, contractId)
        await scCallBet(config.player1Client, config.player1Id, contractId)
        await scCallAcceptBets(config, contractId)
        await getOponent(config, contractId)
        await closeGame(config, contractId)
    } catch (e) {
        console.log(e)
    }

}

// const contractId = ContractId.fromString("0.0.34274659")
// test(contractId)
test()
