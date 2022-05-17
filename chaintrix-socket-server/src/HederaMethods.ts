import { AccountId, PrivateKey, Client, Hbar, ContractCallQuery, ContractFunctionParameters, ContractId, ContractExecuteTransaction, AccountBalanceQuery } from "@hashgraph/sdk";
import { PlayerWantsToPlayHederaPayload } from "../../chaintrix-game-mechanics/dist";
import { HEDERA_CONTRACT_ID } from "./Constants";

require("dotenv").config();


export type HederaConfig = {
    serverId: AccountId,
    serverPrivateKey: PrivateKey,
    serverClient: Client
}

export const toSolidity = (address: string): string => {
    return AccountId.fromString(address).toSolidityAddress()
}

export const getHederaConfig = (): HederaConfig => {
    const serverId = AccountId.fromString(process.env.SERVER_ID);
    const serverPrivateKey = PrivateKey.fromString(process.env.SERVER_PRIVATE_KEY)
    const serverClient = Client.forTestnet().setOperator(serverId, serverPrivateKey)

    serverClient.setMaxQueryPayment(new Hbar(1))

    return {
        serverId: serverId,
        serverPrivateKey: serverPrivateKey,
        serverClient: serverClient
    }
}

export const checkPlayerBet = async (hederaPayload: PlayerWantsToPlayHederaPayload): Promise<boolean> => {
    return await getHasPlayerPlacedBet(getHederaConfig(), AccountId.fromString(hederaPayload.playerAddress))
}

export const getHasPlayerPlacedBet = async (config: HederaConfig, playerId: AccountId): Promise<boolean> => {
    // Query the contract to check changes in state variable
    const contractQueryTx = new ContractCallQuery()
        .setContractId(HEDERA_CONTRACT_ID)
        .setGas(100000)
        .setFunction("hasPlayerPlacedBet", new ContractFunctionParameters().addAddress(playerId.toSolidityAddress()));
    const contractQuerySubmit = await contractQueryTx.execute(config.serverClient);
    const contractQueryResult = contractQuerySubmit.getBool(0);
    return contractQueryResult
}

export const acceptBetsHedera = async (
    config: HederaConfig,
    player0Address: string,
    player1Address: string
) => {
    const contractParams = new ContractFunctionParameters()
        .addAddress(player0Address)
        .addAddress(player1Address);
    const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(HEDERA_CONTRACT_ID)
        .setGas(1000000)
        .setFunction("acceptBets", contractParams);

    const contractExecuteSubmit = await contractExecuteTx.execute(config.serverClient);
    const contractExecuteRx = await contractExecuteSubmit.getReceipt(config.serverClient);
    console.log(`Contract acceptBets call status: ${contractExecuteRx.status}`);
}

export const hederaCloseGame = async (
    config: HederaConfig,
    player0Address: string,
    player1Address: string,
    winnerAddress: string
) => {
    const contractParams = new ContractFunctionParameters()
        .addAddress(player0Address)
        .addAddress(player1Address)
        .addAddress(winnerAddress);
    const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(HEDERA_CONTRACT_ID)
        .setGas(1000000)
        .setFunction("closeGame", contractParams);

    const contractExecuteSubmit = await contractExecuteTx.execute(config.serverClient);
    const contractExecuteRx = await contractExecuteSubmit.getReceipt(config.serverClient);

    console.log(`Close game call status: ${contractExecuteRx.status}`);
}