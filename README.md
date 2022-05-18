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

## Steps

- client0: want to join
- client1: want to join
- server: 
    - ok, send [GameState, playerID] (gameStarted)
{repeat
- client0: 
    - send [Card, positions x,y] (playMove) - update the state directly in browser, if later receives errorMove, reset the state
- server
    - ok: confirm and broadcast [Card, position, new phase] (afterPlayMove)
    - notok: illegal move, send current state / end game / whatever (errorMove)
    - ok and finished: calculate winner, send [winner, ...] (gameEnded)
}

