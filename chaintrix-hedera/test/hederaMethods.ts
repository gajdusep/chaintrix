import {
    ContractFunctionParameters,
    ContractExecuteTransaction,
    ContractCallQuery,
    Hbar,
    ContractId,
    AccountId,
    Client,
    AccountBalanceQuery,
    Status,
    FileId,
    PrivateKey,
    Signer,
    Wallet,
    LocalProvider,
} from "@hashgraph/sdk";
import NodeClient from "@hashgraph/sdk/lib/client/NodeClient";
import { BigNumber } from "@hashgraph/sdk/lib/Transfer";
import { Config } from "./config";
import Web3 from "web3";
// import { AbiCoder } from "web3-eth-abi";

const MAX_GAS = 1000000
const abiCoder = require("web3-eth-abi");
// import { abiCoder } from 'web3-eth-abi'

export const scCallBet = async (
    playerClient: NodeClient, playerId: AccountId, contractId: ContractId,
    amountToBet: number
) => {
    const contractExecuteTx = new ContractExecuteTransaction({ amount: Hbar.fromTinybars(amountToBet) })
        .setContractId(contractId)
        .setGas(MAX_GAS)
        .setFunction("bet", new ContractFunctionParameters().addAddress(playerId.toSolidityAddress()));

    const contractExecuteSubmit = await contractExecuteTx.execute(playerClient);
    const contractExecuteRx = await contractExecuteSubmit.getReceipt(playerClient);
    console.log(`- Contract function call status: ${contractExecuteRx.status}`);
}

export const closeBet = async (
    serverClient: NodeClient, playerID: AccountId, contractId: ContractId
) => {
    const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(MAX_GAS)
        .setFunction("closeBet", new ContractFunctionParameters().addAddress(playerID.toSolidityAddress()));

    const contractExecuteSubmit = await contractExecuteTx.execute(serverClient);
    const contractExecuteRx = await contractExecuteSubmit.getReceipt(serverClient);
    console.log(`- Contract function call status: ${contractExecuteRx.status}`);
}

export const getContractBalance = async (contractId: ContractId, client: Client): Promise<BigNumber> => {
    const contractQueryTx = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(MAX_GAS)
        .setFunction("getBalance", new ContractFunctionParameters());
    const contractQuerySubmit = await contractQueryTx.execute(client);
    const contractQueryResult = contractQuerySubmit.getUint256(0);
    return contractQueryResult;
}

export const getPlayerBalance = async (
    playerId: AccountId, playerClient: Client
): Promise<Hbar> => {
    const accountBalance = await new AccountBalanceQuery()
        .setAccountId(playerId)
        .execute(playerClient);
    return accountBalance.hbars
}

export const getHasPlayerPlacedBet = async (config: Config, contractId: ContractId, playerId: AccountId): Promise<boolean> => {
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
): Promise<Status> => {
    const contractParams = new ContractFunctionParameters()
        .addAddress(player0SolAddress)
        .addAddress(player1SolAddress);
    const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(MAX_GAS)
        .setFunction("acceptBets", contractParams);

    const contractExecuteSubmit = await contractExecuteTx.execute(serverClient);
    const contractExecuteRx = await contractExecuteSubmit.getReceipt(serverClient);
    return contractExecuteRx.status;
}

export const getOpponentAddress = async (contractId: ContractId, playerAccountId: AccountId, client: Client) => {
    const contractQueryTx = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(MAX_GAS)
        .setFunction("getOpponentAddress", new ContractFunctionParameters().addAddress(playerAccountId.toSolidityAddress()));
    const contractQuerySubmit = await contractQueryTx.execute(client);
    const contractQueryResult = contractQuerySubmit.getAddress();
    return AccountId.fromSolidityAddress(contractQueryResult)
}

export const closeGame = async (
    serverClient: Client,
    player0Id: AccountId,
    player1Id: AccountId,
    winnerIndex: number,
    contractId: ContractId,
    fileId: string
): Promise<Status> => {
    const contractParams = new ContractFunctionParameters()
        .addAddress(player0Id.toSolidityAddress())
        .addAddress(player1Id.toSolidityAddress())
        .addUint8(winnerIndex)
        .addAddress(fileId);
    const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(MAX_GAS)
        .setFunction("closeGame", contractParams);

    const contractExecuteSubmit = await contractExecuteTx.execute(serverClient);
    const contractExecuteRx = await contractExecuteSubmit.getReceipt(serverClient);

    return contractExecuteRx.status
}

export const getGames = async (
    // client: Client, privateKey: PrivateKey, contractId: ContractId
    config: Config, contractId: ContractId
): Promise<Array<FileId>> => {
    const contractQueryTx = new ContractCallQuery()
        .setContractId(contractId)
        .setGas((new Hbar(0.01)).toTinybars())
        .setFunction("getAllGames", new ContractFunctionParameters())
        .setQueryPayment(new Hbar(0.05)); // TODO: how many Hbars exactly needed to be paid
    // const contractQuerySubmit = await contractQueryTx.execute(client);
    const wallet = new Wallet(
        config.serverId,
        config.serverPrivateKey,
        new LocalProvider()
    )
    const contractQuerySubmit = await contractQueryTx.executeWithSigner(wallet);

    const contractQueryResult = contractQuerySubmit.asBytes();
    const hexString = Buffer.from(contractQueryResult).toString('hex');
    const result = abiCoder.decodeParameters(['address[]', 'uint256[]'], hexString);
    console.log(result)

    const toReturn = result["0"].map((item) => FileId.fromSolidityAddress(item))

    console.log(`to return: ${toReturn}`)
    // return contractQueryResult.toString()
    return toReturn
}

