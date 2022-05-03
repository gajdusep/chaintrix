# Chaintrix monorepo

This repository contains all directories needed for chaintrix - 
blockchain version of tantrix board game.

## Additional files needed:

Solana private key:

`chaintrix-socket-server` - `id.json`

`chaintrix-solana` - `id.json`

Hedera private keys:

`chaintrix-hedera` - `.env`

## Architecture

What does a server check?

- validity of the move
- 

What information must be broadcasted from the socket to the room?

- after move info contains:
    - playerID, card (cardID, orientation)
    - newCard
    - newPhase and currently playing player

- time remaining
