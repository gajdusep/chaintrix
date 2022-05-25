
import { FileCreateTransaction, FileAppendTransaction, ContractCreateTransaction, ContractId, ContractFunctionParameters } from "@hashgraph/sdk";
import * as fs from "fs";
import { Config } from "./config";

function chunkString(str, length) {
    return str.match(new RegExp('.{1,' + length + '}', 'g'));
}

const getChunks = (buf: Buffer, maxBytes) => {
    const partialResult = chunkString(buf.toString(), maxBytes);
    const result = []
    for (let i = 0; i < partialResult.length; i++) {
        const element = partialResult[i];
        result.push(Buffer.from(element))
        // console.log('------------------')
        // console.log(element)
    }
    return result
}

export const deploy = async (config: Config, BET_AMOUNT: number): Promise<ContractId> => {
    // Import the compiled contract bytecode
    const contractBytecode = fs.readFileSync("./sol/chaintrix_sol_ChaintrixContract.bin");
    const serverClient = config.serverClient;

    const chunks = getChunks(contractBytecode, 5000);

    // Create a file on Hedera and store the bytecode
    const fileCreateTx = new FileCreateTransaction()
        .setContents(chunks[0])
        .setKeys([config.serverPrivateKey])
        .freezeWith(config.serverClient);
    const fileCreateSign = await fileCreateTx.sign(config.serverPrivateKey);
    const fileCreateSubmit = await fileCreateSign.execute(serverClient);
    const fileCreateRx = await fileCreateSubmit.getReceipt(serverClient);
    const bytecodeFileId = fileCreateRx.fileId;

    for (let i = 1; i < chunks.length; i++) {
        const chunkToAppend = chunks[i];
        //Create the transaction
        const transaction = await new FileAppendTransaction()
            .setFileId(bytecodeFileId)
            .setContents(chunkToAppend)
            // .setMaxTransactionFee(new Hbar(2))
            .freezeWith(config.serverClient);

        //Sign with the file private key
        // const signTx = await transaction.sign(fileKey);
        const signTx = await transaction.sign(config.serverPrivateKey);
        const txResponse = await signTx.execute(serverClient);
        const receipt = await txResponse.getReceipt(serverClient);
        const transactionStatus = receipt.status;
    }


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
