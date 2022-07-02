import { ContractId } from "@hashgraph/sdk";

/**
 * GAME RELATED CONSTANTS
 */
// export const INITIAL_TIME = 50
export const INITIAL_TIME = 60
export const SERVER_INITIAL_TIME = INITIAL_TIME + 1

/**
 * SOLANA CONSTANTS
 */
const LOCALHOST_SOLANA_ENDPOINT = 'http://127.0.0.1:8899';
const DEVNET_SOLANA_ENDPOINT = 'https://api.devnet.solana.com';
const PRODUCTION_SOLANA_ENDPOINT = 'https://solana-api.projectserum.com';

export const SOLANA_PROGRAM_ID = 'Agi74KZH6XY5fKPycWtg9X5g4RgfPZpNNmKodLCXDA7q';
// export const SOLANA_ENDPOINT = LOCALHOST_SOLANA_ENDPOINT;
export const SOLANA_ENDPOINT = DEVNET_SOLANA_ENDPOINT;
// export const SOLANA_ENDPOINT = PRODUCTION_SOLANA_ENDPOINT;

/**
 * HEDERA CONSTANTS
 */
export const HEDERA_CONTRACT_ID = new ContractId(46857102);
