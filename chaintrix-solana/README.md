# how to run

Start the local ledger.
```solana-test-validator```

Then, on a separate terminal session.
```
anchor build
anchor deploy
```

Change program id in `Anchor.toml` and `lib.rs`.

If you run the test validator for the first time, fund the wallets that you want to use.

`solana airdrop 5 <wallet>`

Include treasury (CHANGE IN PRODUCTION): `4zvwRjXUKGfvwnParsHAS3HuSVzV5cA4McphgmoCtajS`

```
anchor run test
```


# or turn off your ledger and run:

```anchor test```

# to test arweave

```npx ts-node ./arweave-tests/arweave-test.ts```


# deployment

https://lorisleiva.com/create-a-solana-dapp-from-scratch/deploying-to-devnet

change: `cluster = "localnet"` to `cluster = "devnet"` or opposite

```bash
solana config set --url devnet
```