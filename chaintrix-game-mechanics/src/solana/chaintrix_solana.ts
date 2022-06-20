export type ChaintrixSolana = {
    "version": "0.1.0",
    "name": "chaintrix_solana",
    "instructions": [
        {
            "name": "bet",
            "accounts": [
                {
                    "name": "betAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "player",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bump",
                    "type": "u8"
                },
                {
                    "name": "seed",
                    "type": "bytes"
                }
            ]
        },
        {
            "name": "closeBetWithoutPlaying",
            "accounts": [
                {
                    "name": "betAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "player",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "server",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "acceptBets",
            "accounts": [
                {
                    "name": "acceptedBetsAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "player0BetAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "player1BetAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "server",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bump",
                    "type": "u8"
                },
                {
                    "name": "seed",
                    "type": "bytes"
                }
            ]
        },
        {
            "name": "closeGameWithWinner",
            "accounts": [
                {
                    "name": "gameClosedAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "acceptedBetsAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "player0",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "player1",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "treasury",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "server",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bump",
                    "type": "u8"
                },
                {
                    "name": "seed",
                    "type": "bytes"
                },
                {
                    "name": "winner",
                    "type": "u8"
                },
                {
                    "name": "arweave",
                    "type": "string"
                }
            ]
        }
    ],
    "accounts": [
        {
            "name": "betAccount",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "player",
                        "type": "publicKey"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        },
        {
            "name": "acceptedBetsAccount",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "player0",
                        "type": "publicKey"
                    },
                    {
                        "name": "player1",
                        "type": "publicKey"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        },
        {
            "name": "gameClosedAccount",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "player0",
                        "type": "publicKey"
                    },
                    {
                        "name": "player1",
                        "type": "publicKey"
                    },
                    {
                        "name": "winnerIndex",
                        "type": "u8"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    },
                    {
                        "name": "arweave",
                        "type": "string"
                    }
                ]
            }
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "BetAccountNotEnoughLamports",
            "msg": "The bet account doesn't have enough lamports"
        },
        {
            "code": 6001,
            "name": "WrongAccounts",
            "msg": "Accounts do not fit"
        },
        {
            "code": 6002,
            "name": "WrongParameters",
            "msg": "Wrong parameters"
        },
        {
            "code": 6003,
            "name": "ArweaveIDWrong",
            "msg": "Arweave ID must have 43 chars"
        },
        {
            "code": 6004,
            "name": "CloseGameWrongAccounts",
            "msg": "Closing bets: the accounts are not coresponding to playing accounts"
        }
    ]
};

export const IDL: ChaintrixSolana = {
    "version": "0.1.0",
    "name": "chaintrix_solana",
    "instructions": [
        {
            "name": "bet",
            "accounts": [
                {
                    "name": "betAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "player",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bump",
                    "type": "u8"
                },
                {
                    "name": "seed",
                    "type": "bytes"
                }
            ]
        },
        {
            "name": "closeBetWithoutPlaying",
            "accounts": [
                {
                    "name": "betAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "player",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "server",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "acceptBets",
            "accounts": [
                {
                    "name": "acceptedBetsAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "player0BetAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "player1BetAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "server",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bump",
                    "type": "u8"
                },
                {
                    "name": "seed",
                    "type": "bytes"
                }
            ]
        },
        {
            "name": "closeGameWithWinner",
            "accounts": [
                {
                    "name": "gameClosedAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "acceptedBetsAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "player0",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "player1",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "treasury",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "server",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bump",
                    "type": "u8"
                },
                {
                    "name": "seed",
                    "type": "bytes"
                },
                {
                    "name": "winner",
                    "type": "u8"
                },
                {
                    "name": "arweave",
                    "type": "string"
                }
            ]
        }
    ],
    "accounts": [
        {
            "name": "betAccount",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "player",
                        "type": "publicKey"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        },
        {
            "name": "acceptedBetsAccount",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "player0",
                        "type": "publicKey"
                    },
                    {
                        "name": "player1",
                        "type": "publicKey"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        },
        {
            "name": "gameClosedAccount",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "player0",
                        "type": "publicKey"
                    },
                    {
                        "name": "player1",
                        "type": "publicKey"
                    },
                    {
                        "name": "winnerIndex",
                        "type": "u8"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    },
                    {
                        "name": "arweave",
                        "type": "string"
                    }
                ]
            }
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "BetAccountNotEnoughLamports",
            "msg": "The bet account doesn't have enough lamports"
        },
        {
            "code": 6001,
            "name": "WrongAccounts",
            "msg": "Accounts do not fit"
        },
        {
            "code": 6002,
            "name": "WrongParameters",
            "msg": "Wrong parameters"
        },
        {
            "code": 6003,
            "name": "ArweaveIDWrong",
            "msg": "Arweave ID must have 43 chars"
        },
        {
            "code": 6004,
            "name": "CloseGameWrongAccounts",
            "msg": "Closing bets: the accounts are not coresponding to playing accounts"
        }
    ]
};
