use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use std::str::FromStr;

use crate::account::*;

const SERVER_PUBKEY: &str = "DuugeHRhhpYgmMMSDLwyEFUn66bmwKLuriL17wmw2q4n";
const TREASURY_PUBKEY: &str = "4zvwRjXUKGfvwnParsHAS3HuSVzV5cA4McphgmoCtajS";

#[derive(Accounts)]
#[instruction(bump:u8, seed: Vec<u8>)]
pub struct Bet<'info> {
    #[account(
        init, 
        seeds = [b"seed".as_ref(), &seed], 
        bump, payer = player, space = BetAccount::LEN)]
    pub base_account: Account<'info, BetAccount>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(bump:u8, seed: Vec<u8>)]
pub struct AcceptBets<'info> {
    #[account(
        init, seeds = [b"accepted".as_ref(), &seed], 
        bump, payer = server, space = AcceptedBetsAccount::LEN)]
    pub accepted_bets_account: Account<'info, AcceptedBetsAccount>,
    #[account(mut)]
    pub player0_bet_account: Account<'info, BetAccount>,
    #[account(mut)]
    pub player1_bet_account: Account<'info, BetAccount>,
    #[account(mut, address = Pubkey::from_str(SERVER_PUBKEY).unwrap())]
    pub server: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(bump:u8, seed: Vec<u8>)]
pub struct CloseGameWithWinner<'info> {
    #[account(
        init, seeds = [b"closed".as_ref(), &seed], 
        bump, payer = server, space = GameClosedAccount::LEN)]
    pub game_closed_account: Account<'info, GameClosedAccount>,
    #[account(mut)]
    pub accepted_bets_account: Account<'info, AcceptedBetsAccount>,
    /// CHECK: if player 0 wins, solana will be transfered to him
    #[account(mut)]
    pub player0: AccountInfo<'info>,
    /// CHECK: if player 1 wins, solana will be transfered to him
    #[account(mut)]
    pub player1: AccountInfo<'info>,
    /// CHECK: treasury account will receive fees
    #[account(mut, address = Pubkey::from_str(TREASURY_PUBKEY).unwrap())]
    pub treasury: AccountInfo<'info>,
    #[account(mut, address = Pubkey::from_str(SERVER_PUBKEY).unwrap())]
    pub server: Signer<'info>,
    pub system_program: Program<'info, System>
}
