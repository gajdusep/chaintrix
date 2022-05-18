import { Transaction, TransactionReceipt } from '@hashgraph/sdk';
import { HashConnect, HashConnectTypes, MessageTypes } from 'hashconnect';

export interface SavedData {
    topic: string;
    pairingString: string;
    privateKey?: string;
    pairedWalletData?: HashConnectTypes.WalletMetadata;
    pairedAccounts: string[];
}

export interface HashConnectService {
    hashconnect: HashConnect;
    status: HashConnectStatus;
    savedData: SavedData;
    availableExtensions: HashConnectTypes.WalletMetadata[];
    appMetadata: HashConnectTypes.AppMetadata;
}

export const getNewHashConnectService = (): HashConnectService => {
    return {
        hashconnect: new HashConnect(true),
        status: HashConnectStatus.INITIALIZING,
        availableExtensions: [],
        savedData: {
            topic: "",
            pairingString: "",
            privateKey: undefined,
            pairedWalletData: undefined,
            pairedAccounts: []
        },
        appMetadata: {
            name: "Chaintrix",
            description: "Tantrix on Hedera.",
            icon: "https://www.hashpack.app/img/logo.svg"
        }
    }
}

export enum HashConnectStatus {
    INITIALIZING = 'initializing',
    CONNECTED = 'connected',
    PAIRED = 'paired'
}

const setStatus = (hashconnectWrapper: HashConnectService, status: HashConnectStatus) => {
    console.log(`HASHCONNECT STATUS CHANGED: ${status}`)
    hashconnectWrapper.status = status;
}

export const connectToExtension = async (hashconnectWrapper: HashConnectService) => {
    console.log(`saved data: ${JSON.stringify(hashconnectWrapper.savedData)}`)
    hashconnectWrapper.hashconnect.connectToLocalWallet(hashconnectWrapper.savedData.pairingString);
}

export const sendTransaction = async (
    hashconnectWrapper: HashConnectService,
    trans: Uint8Array, acctToSign: string, return_trans: boolean = false
): Promise<MessageTypes.TransactionResponse> => {
    const transaction: MessageTypes.Transaction = {
        topic: hashconnectWrapper.savedData.topic,
        byteArray: trans,

        metadata: {
            accountToSign: acctToSign,
            returnTransaction: return_trans
        }
    }

    return await hashconnectWrapper.hashconnect.sendTransaction(hashconnectWrapper.savedData.topic, transaction)
}

export const requestAccountInfo = async (hashconnectWrapper: HashConnectService) => {
    let request: MessageTypes.AdditionalAccountRequest = {
        topic: hashconnectWrapper.savedData.topic,
        network: "mainnet",
        multiAccount: true
    }

    await hashconnectWrapper.hashconnect.requestAdditionalAccounts(hashconnectWrapper.savedData.topic, request);
}

export const saveDataInLocalstorage = (hashconnectWrapper: HashConnectService) => {
    let data = JSON.stringify(hashconnectWrapper.savedData);

    localStorage.setItem("hashconnectData", data);
}

export const getSavedData = (): SavedData | null => {
    let foundData = localStorage.getItem("hashconnectData");
    if (foundData) {
        const parsed = JSON.parse(foundData);
        console.log(`Found local data: ${parsed}`)
        return parsed;
    }
    return null
}

export const initHashconnect = async (hashconnectWrapper: HashConnectService): Promise<HashConnectService> => {
    //create the hashconnect instance
    // hashconnectWrapper.hashconnect = new HashConnect(true);

    const savedData = getSavedData()
    if (savedData == null) {
        //first init, store the private key in localstorage
        let initData = await hashconnectWrapper.hashconnect.init(hashconnectWrapper.appMetadata);
        hashconnectWrapper.savedData.privateKey = initData.privKey;

        //then connect, storing the new topic in localstorage
        const state = await hashconnectWrapper.hashconnect.connect();
        console.log("Received state", state);
        hashconnectWrapper.savedData.topic = state.topic;

        //generate a pairing string, which you can display and generate a QR code from
        hashconnectWrapper.savedData.pairingString = hashconnectWrapper.hashconnect.generatePairingString(state, "testnet", true);

        //find any supported local wallets
        hashconnectWrapper.hashconnect.findLocalWallets();

        setStatus(hashconnectWrapper, HashConnectStatus.CONNECTED)
        console.log(`CHANGED TO CONNECTED?: ${hashconnectWrapper.status}`)
    }
    else {
        await hashconnectWrapper.hashconnect.init(hashconnectWrapper.appMetadata, hashconnectWrapper.savedData.privateKey);
        await hashconnectWrapper.hashconnect.connect(hashconnectWrapper.savedData.topic, hashconnectWrapper.savedData.pairedWalletData!);

        setStatus(hashconnectWrapper, HashConnectStatus.PAIRED)
        console.log(`CHANGED TO PAIRED?: ${hashconnectWrapper.status}`)
    }

    setUpEvents(hashconnectWrapper);
    return hashconnectWrapper;
}

export const setUpEvents = (hashconnectWrapper: HashConnectService) => {
    hashconnectWrapper.hashconnect.foundExtensionEvent.on((data) => {
        console.log("Found extension", data);
        hashconnectWrapper.availableExtensions.push(data);
    })

    // this.hashconnect.additionalAccountResponseEvent.on((data) => {
    //     console.log("Received account info", data);

    //     data.accountIds.forEach(id => {
    //         if(this.saveData.pairedAccounts.indexOf(id) == -1)
    //             this.saveData.pairedAccounts.push(id);
    //     })
    // })

    hashconnectWrapper.hashconnect.pairingEvent.on((data) => {
        console.log("Paired with wallet", data);
        setStatus(hashconnectWrapper, HashConnectStatus.PAIRED)

        hashconnectWrapper.savedData.pairedWalletData = data.metadata;

        data.accountIds.forEach(id => {
            if (hashconnectWrapper.savedData.pairedAccounts.indexOf(id) == -1)
                hashconnectWrapper.savedData.pairedAccounts.push(id);
        })

        saveDataInLocalstorage(hashconnectWrapper);
    });


    hashconnectWrapper.hashconnect.transactionEvent.on((data) => {
        //this will not be common to be used in a dapp
        console.log("transaction event callback");
    });
}

export const clearPairings = (hashconnectWrapper: HashConnectService) => {
    hashconnectWrapper.savedData.pairedAccounts = [];
    hashconnectWrapper.savedData.pairedWalletData = undefined;
    setStatus(hashconnectWrapper, HashConnectStatus.CONNECTED)
    localStorage.removeItem("hashconnectData");
}
