import { Client, FileAppendTransaction, FileContentsQuery, FileCreateTransaction, FileId, PrivateKey } from "@hashgraph/sdk";

export const chunkString = (str: string, length: number) => {
    return str.match(new RegExp('.{1,' + length + '}', 'g'));
}

export const getChunks = (buf: Buffer, maxBytes) => {
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

export const uploadFileToHederaFS = async (
    privateKey: PrivateKey, client: Client,
    chunks: Array<any>
): Promise<FileId> => {

    // Create a file on Hedera and store the bytecode
    const fileCreateTx = new FileCreateTransaction()
        .setContents(chunks[0])
        .setKeys([privateKey])
        .freezeWith(client);
    const fileCreateSign = await fileCreateTx.sign(privateKey);
    const fileCreateSubmit = await fileCreateSign.execute(client);
    const fileCreateRx = await fileCreateSubmit.getReceipt(client);
    const bytecodeFileId = fileCreateRx.fileId;

    for (let i = 1; i < chunks.length; i++) {
        const chunkToAppend = chunks[i];
        //Create the transaction
        const transaction = await new FileAppendTransaction()
            .setFileId(bytecodeFileId)
            .setContents(chunkToAppend)
            .freezeWith(client);

        //Sign with the file private key
        // const signTx = await transaction.sign(fileKey);
        const signTx = await transaction.sign(privateKey);
        const txResponse = await signTx.execute(client);
        const receipt = await txResponse.getReceipt(client);
        const transactionStatus = receipt.status;
    }

    return bytecodeFileId;
}

export const getFileContents = async (fileId: FileId, client: Client): Promise<string> => {
    const query = new FileContentsQuery()
        .setFileId(fileId);

    const contents = await query.execute(client);

    // console.log(contents.toString());

    return contents.toString();
}
