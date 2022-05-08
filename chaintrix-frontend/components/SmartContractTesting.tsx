import React, { useState, useEffect } from 'react'
import {
    Client, PrivateKey, AccountCreateTransaction,
    AccountBalanceQuery, Hbar, TransferTransaction,
    ContractCallQuery, ContractId, ContractFunctionParameters,
    TransactionReceipt, ContractFunctionResult, TransactionReceiptQuery,

} from "@hashgraph/sdk";
import { HashConnect, HashConnectTypes } from 'hashconnect';
import { HashConnectService } from '../helpers/HashConnectService'
import web3 from 'web3'

type SmartContractTestingProps = {
}

const SmartContractTesting = (
    props: SmartContractTestingProps
) => {

    const [pairingString, setPairingString] = useState<string>("");
    const [hashConnectService, setHashConnectService] = useState<HashConnectService>(() => { return new HashConnectService() })
    const [responseData, setResponseData] = useState<string>("no response yet")


    const connectToWallet = async () => {
        await hashConnectService.connectToExtension();
    }

    useEffect(() => {
        const runEffect = async () => {
            await hashConnectService.initHashconnect();
        }
        runEffect()
    }, [])

    const runTransaction = async () => {
        const contractId = new ContractId(34021824)
        //this is the example contract from https://hedera.com/blog/how-to-deploy-smart-contracts-on-hedera-part-1-a-simple-getter-and-setter-contract
        let trans = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction("getMobileNumber", new ContractFunctionParameters().addString("Alice"))
            .setMaxQueryPayment(new Hbar(0.00000001));

        let transactionBytes: Uint8Array = await trans.toBytes();

        const signingAcctWTF = "0.0.34055185"
        let res = await hashConnectService.sendTransaction(transactionBytes, signingAcctWTF, false);

        //handle response
        let responseData: any = {
            response: res,
            receipt: null
        }


        //todo: how to change query bytes back to query?
        if (res.success) {
            const bytes = res.receipt as Uint8Array
            console.log(`what: ${bytes.length}, ${bytes}`)
            const tvlnevim = web3.utils.hexToNumberString(`0x${Buffer.from(bytes).toString('hex')}`)
            console.log(`tvl tak nevim: ${tvlnevim}`)
        }
    }

    return (
        <div className="box" style={{
            height: '500px', width: '500px', position: 'relative',
            overflow: 'hidden', padding: '0', backgroundColor: '#ffffaf',
            display: 'flex', flexDirection: 'column'
        }}>
            <div>we are here</div>
            <button style={{ height: 50 }} onClick={() => { connectToWallet() }}>Connect to wallet</button>
            <button style={{ height: 50 }} onClick={() => { runTransaction() }}>Run transaction</button>
            <div style={{ width: `100%`, padding: 10, margin: 10 }}>{responseData}</div>
        </div>

    )
}

export default SmartContractTesting;
