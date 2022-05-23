
import { FileCreateTransaction, FileAppendTransaction, ContractCreateTransaction, ContractId } from "@hashgraph/sdk";
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

export const deploy = async (config: Config): Promise<ContractId> => {
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
    console.log(`- The bytecode file ID is: ${bytecodeFileId}`);

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
        console.log("The transaction consensus status is " + transactionStatus);
    }


    // Instantiate the smart contract
    const contractInstantiateTx = new ContractCreateTransaction()
        .setBytecodeFileId(bytecodeFileId)
        .setGas(1 * 1000 * 1000);
    // .setConstructorParameters();
    const contractInstantiateSubmit = await contractInstantiateTx.execute(serverClient);
    const contractInstantiateRx = await contractInstantiateSubmit.getReceipt(serverClient);
    const contractId = contractInstantiateRx.contractId;
    const contractAddress = contractId.toSolidityAddress();
    console.log(`- The smart contract ID is: ${contractId}`);
    console.log(`- The smart contract ID in Solidity format is: ${contractAddress}`);

    return contractId;
}
