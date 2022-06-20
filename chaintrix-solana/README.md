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