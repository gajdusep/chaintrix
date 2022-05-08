import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk } from './store';
import socketIOClient, { Socket } from "socket.io-client";
import { LOCALHOST_PROGRAM_ID, LOCALHOST_SOCKET_ENDPOINT, LOCALHOST_SOLANA_ENDPOINT } from '../helpers/Constants';
import {
    getNewHashConnectService, HashConnectService,
    initHashconnect, getSavedData, SavedData, HashConnectStatus, setUpEvents
} from '../helpers/HashConnectService';
import { HashConnect, HashConnectTypes, MessageTypes } from 'hashconnect';

export interface HederaState {
    hashConnecteService: HashConnectService | null
    status: HashConnectStatus
}

const initialState: HederaState = {
    // hashConnecteService: getNewHashConnectService()
    hashConnecteService: null,
    status: HashConnectStatus.INITIALIZING
};

export const initHederaAsync = createAsyncThunk(
    'hedera/initHederaService',
    async (_, thunkAPI) => {
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

        hashconnectWrapper.hashconnect.findLocalWallets();
        return { 'wrapper': hashconnectWrapper, 'data': savedData }
    }
);

export const hederaSlice = createSlice({
    name: 'hedera',
    initialState,
    reducers: {
        setUpHederaEvents: (state) => {
            state.hashConnecteService?.hashconnect.foundExtensionEvent.on((data) => {
                console.log("Found extension", data);
                state.hashConnecteService?.availableExtensions.push(data);
            })

            // this.hashconnect.additionalAccountResponseEvent.on((data) => {
            //     console.log("Received account info", data);

            //     data.accountIds.forEach(id => {
            //         if(this.saveData.pairedAccounts.indexOf(id) == -1)
            //             this.saveData.pairedAccounts.push(id);
            //     })
            // })

            state.hashConnecteService?.hashconnect.pairingEvent.on((data) => {
                if (state.hashConnecteService == null) return;

                console.log("Paired with wallet", data);
                state.status = HashConnectStatus.PAIRED
                // setStatus(state.hashConnecteService?, HashConnectStatus.PAIRED)

                state.hashConnecteService.savedData.pairedWalletData = data.metadata;

                data.accountIds.forEach(id => {
                    if (state.hashConnecteService == null) return;
                    if (state.hashConnecteService.savedData.pairedAccounts.indexOf(id) == -1)
                        state.hashConnecteService.savedData.pairedAccounts.push(id);
                })

                // saveDataInLocalstorage(hashconnectWrapper);
            });


            state.hashConnecteService?.hashconnect.transactionEvent.on((data) => {
                //this will not be common to be used in a dapp
                console.log("transaction event callback");
            });
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
                state.hashConnecteService = hashConnectService;
                state.hashConnecteService.savedData = savedData
                if (state.hashConnecteService) {
                    console.log('setting up events')
                    // setUpEvents(hashConnectService)
                }
                // hashConnectService.hashconnect.connectToLocalWallet();
                state.status = HashConnectStatus.PAIRED;


            })
            .addCase(initHederaAsync.rejected, (state) => {
                console.log(`failed`)
                // state.status = 'failed';
            });
    },
});

export const {
    setUpHederaEvents
} = hederaSlice.actions;

export const selectHederaConnectService = (state: RootState) => state.hederaSlice.hashConnecteService;
export const selectHederaStatus = (state: RootState) => state.hederaSlice.status

export default hederaSlice.reducer;
