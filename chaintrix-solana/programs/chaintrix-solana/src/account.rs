use anchor_lang::prelude::*;

const DISCRIMINATOR_LENGTH: usize = 8;
macro_rules! size {
    ($name: ident, $size:expr) => {
        impl $name {
            pub const LEN: usize = DISCRIMINATOR_LENGTH + $size;
        }
    };
}

const PUBKEY_LENGTH: usize = 32;
const U8_LENGTH: usize = 1;

#[account]
pub struct BetAccount {
    pub player: Pubkey,
    pub bump: u8,
}
size!(BetAccount, PUBKEY_LENGTH + U8_LENGTH);

#[account]
pub struct AcceptedBetsAccount {
    pub player0: Pubkey,
    pub player1: Pubkey,
    pub bump: u8,
}

size!(AcceptedBetsAccount, 2 * PUBKEY_LENGTH + U8_LENGTH);

#[account]
pub struct GameClosedAccount {
    pub player0: Pubkey,
    pub player1: Pubkey,
    pub winner_index: u8,
    pub bump: u8,
}

size!(GameClosedAccount, 2 * PUBKEY_LENGTH + 2 * U8_LENGTH);
