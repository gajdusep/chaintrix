import {
    ContractFunctionParameters,
    ContractExecuteTransaction,
    ContractCallQuery,
    Hbar,
    ContractId
} from "@hashgraph/sdk";
import { Config } from "./config";

export const scCallBet = async (playerClient, playerId, contractId: ContractId) => {
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
