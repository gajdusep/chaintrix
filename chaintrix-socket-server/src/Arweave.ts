import Arweave from 'arweave'
import * as fs from 'fs';

export interface ArweaveConfig {
    key: any,
    arweave: Arweave
}

export const getArweaveKey = (): object => {
    console.log(`read`)
    const arweaveKey = JSON.parse(fs.readFileSync('./arweave-key.json').toString())
    console.log(`finished read`)
    return arweaveKey
}

export const getArweaveConfig = (): ArweaveConfig => {
    const arweave = Arweave.init({
        host: "arweave.net",
        port: 443,
        protocol: "https",
    })

    const key = getArweaveKey()
    return {
        key: key,
        arweave: arweave
    }
}

export const showBalance = async (arweave: Arweave, address: string): Promise<string> => {
    const balance = await arweave.wallets.getBalance(address)
    let ar = arweave.ar.winstonToAr(balance);
    return ar
}

export const uploadGameMovesToArweave = async (arweaveConfig: ArweaveConfig, movesBuffer: Buffer): Promise<string> => {
    const transaction = await arweaveConfig.arweave.createTransaction({
        data: movesBuffer
    }, arweaveConfig.key);

    // TODO: should be JSON
    transaction.addTag("Content-Type", "application/json");
    await arweaveConfig.arweave.transactions.sign(transaction, arweaveConfig.key);
    const response = await arweaveConfig.arweave.transactions.post(transaction);
    return transaction.id
}
