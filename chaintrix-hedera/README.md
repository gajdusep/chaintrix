# Hedera smart contract and tests

## Install

```bash
npm install
```

Add `.env` file with necessary env variables.

The needed vars are:

- SERVER_ID, SERVER_PRIVATE_KEY
- PLAYER0_ID, PLAYER0_PRIVATE_KEY
- PLAYER1_ID, PLAYER1_PRIVATE_KEY
- PLAYER2_ID, PLAYER2_PRIVATE_KEY

## Run

```bash
cd sol
solcjs --bin chaintrix.sol
```

```bash
ts-node ./test/test.ts
```

