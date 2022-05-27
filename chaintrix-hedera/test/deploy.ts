
import { FileCreateTransaction, FileAppendTransaction, ContractCreateTransaction, ContractId, ContractFunctionParameters } from "@hashgraph/sdk";
import * as fs from "fs";
import { Config } from "./config";
import { getChunks, uploadFileToHederaFS } from "./fileHederaMethods";

export const deploy = async (config: Config, BET_AMOUNT: number): Promise<ContractId> => {
    // Import the compiled contract bytecode
    const contractBytecode = fs.readFileSync("./sol/chaintrix_sol_ChaintrixContract.bin");
    const serverClient = config.serverClient;

    const chunks = getChunks(contractBytecode, 5000);
    const bytecodeFileId = await uploadFileToHederaFS(config.serverPrivateKey, config.serverClient, chunks);

    // Instantiate the smart contract
    const contractInstantiateTx = new ContractCreateTransaction()
        .setBytecodeFileId(bytecodeFileId)
        .setGas(1 * 1000 * 1000)
        .setConstructorParameters(new ContractFunctionParameters().addUint256(BET_AMOUNT));
    const contractInstantiateSubmit = await contractInstantiateTx.execute(serverClient);
    const contractInstantiateRx = await contractInstantiateSubmit.getReceipt(serverClient);
    const contractId = contractInstantiateRx.contractId;
    return contractId;
}
