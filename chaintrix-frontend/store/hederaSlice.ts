import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk, store } from './store';
import {
    getNewHashConnectService, HashConnectService,
    SavedData, HashConnectStatus
} from '../helpers/HashConnectService';
import { HashConnect, HashConnectTypes, MessageTypes } from 'hashconnect';

// TODO: don't hold account ids in saved data, refresh after every loading!!!

export interface HederaState {
    hashConnectService: HashConnectService | null
    status: HashConnectStatus
}

const initialState: HederaState = {
    // hashConnecteService: getNewHashConnectService()
    hashConnectService: null,
    status: HashConnectStatus.INITIALIZING
};

export const initHederaAsync = createAsyncThunk(
    'hedera/initHederaService',
    async (_, thunkAPI) => {

        console.log(`INIT HEDERA ASYNC`)

        // const hashconnectWrapper = (thunkAPI.getState() as RootState).hederaSlice.hashConnecteService
        const hashconnectWrapper = getNewHashConnectService()

        // setUpEvents(hashconnectWrapper);
        let initData = await hashconnectWrapper.hashconnect.init(hashconnectWrapper.appMetadata);


        const state = await hashconnectWrapper.hashconnect.connect();
        const pairingString = hashconnectWrapper.hashconnect.generatePairingString(state, "testnet", true);
        console.log(`pairing string: ${pairingString}`)
        console.log("Received state", state);

        const savedData: SavedData = {
            privateKey: initData.privKey,
            topic: state.topic,
            pairingString: pairingString,
            pairedAccounts: []
        }

        hashconnectWrapper.hashconnect.foundExtensionEvent.on((data) => {
            console.log("Found extension", data);
            store.dispatch(addAvailableExtension({ data: data }))
        });

        hashconnectWrapper.hashconnect.pairingEvent.on((data) => {
            console.log("Paired with wallet", data);
            // console.log(`And after paired, the signer is: ${}`)
            // state.status = HashConnectStatus.PAIRED
            // setStatus(state.hashConnecteService?, HashConnectStatus.PAIRED)
            store.dispatch(setPairedData({ pairedWalletData: data.metadata, accountsIds: data.accountIds }))
            // TODO: save data in localstorage
            // saveDataInLocalstorage(hashconnectWrapper);
        });

        hashconnectWrapper.hashconnect.transactionEvent.on((data) => {
            //this will not be common to be used in a dapp
            console.log("transaction event callback");
        });


        hashconnectWrapper.hashconnect.findLocalWallets();
        return { 'wrapper': hashconnectWrapper, 'data': savedData }
    }
);

export const hederaSlice = createSlice({
    name: 'hedera',
    initialState,
    reducers: {
        addAvailableExtension: (state, action: PayloadAction<{ data: any }>) => {
            state.hashConnectService?.availableExtensions.push(action.payload.data);
        },
        setPairedData: (state, action: PayloadAction<{ pairedWalletData: HashConnectTypes.WalletMetadata, accountsIds: Array<string> }>) => {
            if (!state.hashConnectService) return;
            state.hashConnectService.savedData.pairedWalletData = action.payload.pairedWalletData;
            action.payload.accountsIds.forEach(id => {
                if (state.hashConnectService == null) return;
                if (state.hashConnectService.savedData.pairedAccounts.indexOf(id) == -1)
                    state.hashConnectService.savedData.pairedAccounts.push(id);
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
                state.hashConnectService = hashConnectService;
                state.hashConnectService.savedData = savedData
                if (state.hashConnectService) {
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

export const selectHederaConnectService = (state: RootState) => state.hederaSlice.hashConnectService;
export const selectHederaStatus = (state: RootState) => state.hederaSlice.status

export default hederaSlice.reducer;
