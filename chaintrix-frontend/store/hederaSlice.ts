import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk, store } from './store';
import { HashConnect, HashConnectTypes, MessageTypes } from 'hashconnect';

export enum HashConnectStatus {
    INITIALIZING = 'initializing',
    CONNECTED = 'connected',
    PAIRED = 'paired'
}
export interface HederaState {
    hashConnectWrapper: HashConnectWrapper | null
    status: HashConnectStatus
}

const initialState: HederaState = {
    hashConnectWrapper: null,
    status: HashConnectStatus.INITIALIZING
};

export interface SavedData {
    topic: string;
    pairingString: string;
    privateKey?: string;
    pairedWalletData?: HashConnectTypes.WalletMetadata;
    pairedAccounts: string[];
}

export interface HashConnectWrapper {
    hashconnect: HashConnect;
    status: HashConnectStatus;
    savedData: SavedData;
    availableExtensions: HashConnectTypes.WalletMetadata[];
    appMetadata: HashConnectTypes.AppMetadata;
}

const getNewHashConnectWrapper = (): HashConnectWrapper => {
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

export const connectToExtension = async (hashConnectWrapper: HashConnectWrapper) => {
    console.log(`saved data: ${JSON.stringify(hashConnectWrapper.savedData)}`)
    hashConnectWrapper.hashconnect.connectToLocalWallet(hashConnectWrapper.savedData.pairingString);
}

export const sendTransaction = async (
    hashConnectWrapper: HashConnectWrapper,
    trans: Uint8Array, acctToSign: string, return_trans: boolean = false
): Promise<MessageTypes.TransactionResponse> => {
    console.log(`in send transaction`)
    const transaction: MessageTypes.Transaction = {
        topic: hashConnectWrapper.savedData.topic,
        byteArray: trans,

        metadata: {
            accountToSign: acctToSign,
            returnTransaction: return_trans
        }
    }
    console.log(`transaction: ${JSON.stringify(transaction)}`)
    const result = await hashConnectWrapper.hashconnect.sendTransaction(hashConnectWrapper.savedData.topic, transaction)
    console.log(`result: ${result}`)
    return result
}

export const initHederaAsync = createAsyncThunk(
    'hedera/initHederaService',
    async (_, thunkAPI) => {

        console.log(`INIT HEDERA ASYNC`)

        // const hashconnectWrapper = (thunkAPI.getState() as RootState).hederaSlice.hashConnecteService
        const hashConnectWrapper = getNewHashConnectWrapper()

        // setUpEvents(hashconnectWrapper);
        let initData = await hashConnectWrapper.hashconnect.init(hashConnectWrapper.appMetadata);


        const state = await hashConnectWrapper.hashconnect.connect();
        const pairingString = hashConnectWrapper.hashconnect.generatePairingString(state, "testnet", true);
        console.log(`pairing string: ${pairingString}`)
        console.log("Received state", state);

        const savedData: SavedData = {
            privateKey: initData.privKey,
            topic: state.topic,
            pairingString: pairingString,
            pairedAccounts: []
        }

        hashConnectWrapper.hashconnect.foundExtensionEvent.on((data) => {
            console.log("Found extension", data);
            store.dispatch(addAvailableExtension({ data: data }))
        });

        hashConnectWrapper.hashconnect.pairingEvent.on((data) => {
            console.log("Paired with wallet", data);
            store.dispatch(setPairedData({ pairedWalletData: data.metadata, accountsIds: data.accountIds }))
        });

        hashConnectWrapper.hashconnect.transactionEvent.on((data) => {
            //this will not be common to be used in a dapp
            console.log("transaction event callback");
        });


        hashConnectWrapper.hashconnect.findLocalWallets();
        return { 'wrapper': hashConnectWrapper, 'data': savedData }
    }
);

export const hederaSlice = createSlice({
    name: 'hedera',
    initialState,
    reducers: {
        addAvailableExtension: (state, action: PayloadAction<{ data: any }>) => {
            state.hashConnectWrapper?.availableExtensions.push(action.payload.data);
        },
        setPairedData: (state, action: PayloadAction<{ pairedWalletData: HashConnectTypes.WalletMetadata, accountsIds: Array<string> }>) => {
            if (!state.hashConnectWrapper) return;
            state.hashConnectWrapper.savedData.pairedWalletData = action.payload.pairedWalletData;
            action.payload.accountsIds.forEach(id => {
                if (state.hashConnectWrapper == null) return;
                if (state.hashConnectWrapper.savedData.pairedAccounts.indexOf(id) == -1)
                    state.hashConnectWrapper.savedData.pairedAccounts.push(id);
            })
            state.status = HashConnectStatus.PAIRED;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(initHederaAsync.pending, (state) => {
                console.log(`pending`)
                // state.status = 'loading';
            })
            .addCase(initHederaAsync.fulfilled, (state, action) => {
                console.log(`fulfilled`)
                // state.status = 'idle';
                // state.value += action.payload;
                const hashConnectService = action.payload.wrapper
                const savedData = action.payload.data;
                state.hashConnectWrapper = hashConnectService;
                state.hashConnectWrapper.savedData = savedData
                if (state.hashConnectWrapper) {
                    // setUpEvents(hashConnectService)
                }
                // hashConnectService.hashconnect.connectToLocalWallet();
                state.status = HashConnectStatus.CONNECTED;
            })
            .addCase(initHederaAsync.rejected, (state) => {
                console.log(`failed`)
                // state.status = 'failed';
            });
    },
});

export const {
    addAvailableExtension,
    setPairedData
} = hederaSlice.actions;

export const selectHederaConnectService = (state: RootState) => state.hederaSlice.hashConnectWrapper;
export const selectHederaStatus = (state: RootState) => state.hederaSlice.status

export default hederaSlice.reducer;
