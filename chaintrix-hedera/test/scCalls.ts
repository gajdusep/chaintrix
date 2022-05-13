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

export const scCallBet = async (playerClient: NodeClient, playerId: AccountId, contractId: ContractId) => {
    const contractExecuteTx = new ContractExecuteTransaction({ amount: Hbar.fromTinybars(777) })
        .setContractId(contractId)
        .setGas(1000000)
        .setFunction("bet", new ContractFunctionParameters().addAddress(playerId.toSolidityAddress()));

    const contractExecuteSubmit = await contractExecuteTx.execute(playerClient);
    const contractExecuteRx = await contractExecuteSubmit.getReceipt(playerClient);
    console.log(`- Contract function call status: ${contractExecuteRx.status}`);
}

export const getBalance = async (config: Config, contractId: ContractId) => {
    // Query the contract to check changes in state variable
    const contractQueryTx = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100000)
        .setFunction("getBalance", new ContractFunctionParameters());
    const contractQuerySubmit = await contractQueryTx.execute(config.player0Client);
    const contractQueryResult = contractQuerySubmit.getUint256(0);
    console.log(`- Balance of the contract: ${contractQueryResult} \n`);
}

export const scCallAcceptBets = async (config: Config, contractId: ContractId) => {
    const contractParams = new ContractFunctionParameters()
        .addAddress(config.player0Id.toSolidityAddress())
        .addAddress(config.player1Id.toSolidityAddress());
    const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(1000000)
        .setFunction("acceptBets", contractParams);

    // The following two lines shouldn't work, because player0 is not authorized to do that
    // const contractExecuteSubmit = await contractExecuteTx.execute(config.player0Client);
    // const contractExecuteRx = await contractExecuteSubmit.getReceipt(config.player0Client);
    const contractExecuteSubmit = await contractExecuteTx.execute(config.serverClient);
    const contractExecuteRx = await contractExecuteSubmit.getReceipt(config.serverClient);
    console.log(`- Contract acceptBets call status: ${contractExecuteRx.status}`);
}

const getOponentGeneric = async (config: Config, contractId: ContractId, playerAccountId: AccountId, shouldBe: AccountId) => {
    const contractQueryTx = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100000)
        .setFunction("getOponentAddress", new ContractFunctionParameters().addAddress(playerAccountId.toSolidityAddress()));
    const contractQuerySubmit = await contractQueryTx.execute(config.player0Client);
    const contractQueryResult = contractQuerySubmit.getAddress();
    console.log(`- Player ${playerAccountId} oponent address: ${AccountId.fromSolidityAddress(contractQueryResult)}, should be: ${shouldBe}`);
}

export const getOponent = async (config: Config, contractId: ContractId) => {
    await getOponentGeneric(config, contractId, config.player0Id, config.player1Id)
    await getOponentGeneric(config, contractId, config.player1Id, config.player0Id)
}

export const closeGame = async (config: Config, contractId: ContractId) => {
    // player1 won
    const accountBalance = await new AccountBalanceQuery()
        .setAccountId(config.player1Id)
        .execute(config.player1Client);
    console.log("Player1 account balance is: " + accountBalance.hbars.toTinybars() + " tinybar.");

    const contractParams = new ContractFunctionParameters()
        .addAddress(config.player0Id.toSolidityAddress())
        .addAddress(config.player1Id.toSolidityAddress())
        .addAddress(config.player1Id.toSolidityAddress());
    const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(1000000)
        .setFunction("closeGame", contractParams);

    const contractExecuteSubmit = await contractExecuteTx.execute(config.serverClient);
    const contractExecuteRx = await contractExecuteSubmit.getReceipt(config.serverClient);

    console.log(`- Close game call status: ${contractExecuteRx.status}`);
    const accountBalance2 = await new AccountBalanceQuery()
        .setAccountId(config.player1Id)
        .execute(config.player1Client);
    console.log("Player1 account balance is: " + accountBalance2.hbars.toTinybars() + " tinybar.");

    console.log(`the difference: ${accountBalance2.hbars.toTinybars() - accountBalance.hbars.toTinybars()}`)
}
