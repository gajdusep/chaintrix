import {
    ContractFunctionParameters,
    ContractExecuteTransaction,
    ContractCallQuery,
    Hbar,
    ContractId,
    AccountId,
    Client,
    AccountBalanceQuery
} from "@hashgraph/sdk";
import NodeClient from "@hashgraph/sdk/lib/client/NodeClient";
import { Config } from "./config";


const MAX_GAS = 1000000
const MAX_GASS_BIGGER = MAX_GAS * 10
export const scCallBet = async (playerClient: NodeClient, playerId: AccountId, contractId: ContractId) => {
    const contractExecuteTx = new ContractExecuteTransaction({ amount: Hbar.fromTinybars(777) })
        .setContractId(contractId)
        .setGas(MAX_GAS)
        .setFunction("bet", new ContractFunctionParameters().addAddress(playerId.toSolidityAddress()));

    const contractExecuteSubmit = await contractExecuteTx.execute(playerClient);
    const contractExecuteRx = await contractExecuteSubmit.getReceipt(playerClient);
    console.log(`- Contract function call status: ${contractExecuteRx.status}`);
}

export const getBalance = async (config: Config, contractId: ContractId) => {
    // Query the contract to check changes in state variable
    const contractQueryTx = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(MAX_GAS)
        .setFunction("getBalance", new ContractFunctionParameters());
    const contractQuerySubmit = await contractQueryTx.execute(config.player0Client);
    const contractQueryResult = contractQuerySubmit.getUint256(0);
    console.log(`- Balance of the contract: ${contractQueryResult} \n`);
}

export const getHasPlayerPlacedBet = async (config: Config, contractId: ContractId, playerId: AccountId): Promise<boolean> => {
    // Query the contract to check changes in state variable
    const contractQueryTx = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(MAX_GAS)
        .setFunction("hasPlayerPlacedBet", new ContractFunctionParameters().addAddress(playerId.toSolidityAddress()));
    const contractQuerySubmit = await contractQueryTx.execute(config.serverClient);
    const contractQueryResult = contractQuerySubmit.getBool(0);
    return contractQueryResult
}

export const getServerAddress = async (config: Config, contractId: ContractId): Promise<AccountId> => {
    const contractQueryTx = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(MAX_GAS)
        .setFunction("getServerAddress", new ContractFunctionParameters());
    const contractQuerySubmit = await contractQueryTx.execute(config.serverClient);
    const contractQueryResult = contractQuerySubmit.getAddress(0);
    return AccountId.fromSolidityAddress(contractQueryResult)
}

export const scCallAcceptBets = async (
    serverClient: Client, player0SolAddress: string, player1SolAddress: string, contractId: ContractId
) => {

    const contractParams = new ContractFunctionParameters()
        .addAddress(player0SolAddress)
        .addAddress(player1SolAddress);
    const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(MAX_GAS)
        .setFunction("acceptBets", contractParams);

    const contractExecuteSubmit = await contractExecuteTx.execute(serverClient);
    const contractExecuteRx = await contractExecuteSubmit.getReceipt(serverClient);
    console.log(`- Contract acceptBets call status: ${contractExecuteRx.status}`);
}

export const getOpponentAddress = async (config: Config, contractId: ContractId, playerAccountId: AccountId) => {
    const contractQueryTx = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(MAX_GAS)
        .setFunction("getOpponentAddress", new ContractFunctionParameters().addAddress(playerAccountId.toSolidityAddress()));
    const contractQuerySubmit = await contractQueryTx.execute(config.player0Client);
    const contractQueryResult = contractQuerySubmit.getAddress();
    return AccountId.fromSolidityAddress(contractQueryResult)
}

const getOponentGeneric = async (config: Config, contractId: ContractId, playerAccountId: AccountId, shouldBe: AccountId) => {
    const contractQueryTx = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(MAX_GAS)
        .setFunction("getOpponentAddress", new ContractFunctionParameters().addAddress(playerAccountId.toSolidityAddress()));
    const contractQuerySubmit = await contractQueryTx.execute(config.player0Client);
    const contractQueryResult = contractQuerySubmit.getAddress();
    console.log(`- Player ${playerAccountId} oponent address: ${AccountId.fromSolidityAddress(contractQueryResult)}, should be: ${shouldBe}`);
}

export const getOponent = async (config: Config, contractId: ContractId) => {
    await getOponentGeneric(config, contractId, config.player0Id, config.player1Id)
    await getOponentGeneric(config, contractId, config.player1Id, config.player0Id)
}

export const closeGame = async (
    serverClient: Client,
    winnerId: AccountId, winnerClient: Client,
    loserId: AccountId,
    contractId: ContractId
) => {
    // player1 won
    const accountBalance = await new AccountBalanceQuery()
        .setAccountId(winnerId)
        .execute(winnerClient);
    console.log("Player1 account balance is: " + accountBalance.hbars.toTinybars() + " tinybar.");

    const contractParams = new ContractFunctionParameters()
        .addAddress(winnerId.toSolidityAddress())
        .addAddress(loserId.toSolidityAddress())
        .addAddress(winnerId.toSolidityAddress());
    const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(MAX_GAS)
        .setFunction("closeGame", contractParams);

    const contractExecuteSubmit = await contractExecuteTx.execute(serverClient);
    const contractExecuteRx = await contractExecuteSubmit.getReceipt(serverClient);

    console.log(`- Close game call status: ${contractExecuteRx.status}`);
    const accountBalance2 = await new AccountBalanceQuery()
        .setAccountId(winnerId)
        .execute(winnerClient);
    console.log("Player1 account balance is: " + accountBalance2.hbars.toTinybars() + " tinybar.");

    console.log(`the difference: ${accountBalance2.hbars.toTinybars() - accountBalance.hbars.toTinybars()}`)
}
