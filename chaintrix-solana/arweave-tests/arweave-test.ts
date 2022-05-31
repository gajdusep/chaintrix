import Arweave from 'arweave'
import * as fs from 'fs';

const showBalance = async (arweave: Arweave) => {
    const balance = await arweave.wallets.getBalance('eDpQOpdTYFYe1yt7lB2pOoUIpbn1QEkI5c0EEiFJdyU')
    let winston = balance;
    let ar = arweave.ar.winstonToAr(balance);
    console.log(winston);
    //125213858712

    console.log(ar);
    //0.125213858712
}

const test = async () => {
    const arweave = Arweave.init({
        host: "arweave.net",
        port: 443,
        protocol: "https",
    })
    await showBalance(arweave)

    const key = JSON.parse(fs.readFileSync('./arweave-key.json').toString())
    // upload data to arweave
    const data = Buffer.from(`[{"p":{"id":"4","or":0},"x":1,"y":1,"n":"14"},{"p":{"id":"2","or":0},"x":1,"y":2,"n":"12"},{"p":{"id":"14","or":3},"x":2,"y":3,"n":null}]`, 'utf-8')

    const transaction = await arweave.createTransaction({
        data: data,
    }, key);

    transaction.addTag("Content-Type", "application/json");
    await arweave.transactions.sign(transaction, key);

    console.log(`${transaction.id} -- ${transaction.id.length}`)
    // console.log(`arweave.net/${transaction.id}`)

    // const response = await arweave.transactions.post(transaction);
    // console.log(response);
    await showBalance(arweave)
}

test()
