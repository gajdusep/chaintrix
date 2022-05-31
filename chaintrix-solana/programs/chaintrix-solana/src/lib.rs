use anchor_lang::prelude::*;
use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;

use account::*;
use context::*;

mod account;
mod context;

const BET_AMOUNT: u64 = LAMPORTS_PER_SOL / 10; // 0.1 sol

declare_id!("Agi74KZH6XY5fKPycWtg9X5g4RgfPZpNNmKodLCXDA7q");

#[program]
pub mod chaintrix_solana {
    use super::*;

    pub fn bet(ctx: Context<Bet>, bump: u8, seed: Vec<u8>) -> Result<()> {
        let base_account: &mut Account<BetAccount> = &mut ctx.accounts.base_account;
        base_account.bump = bump;
        base_account.player = ctx.accounts.player.key();

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.player.key(),
            &ctx.accounts.base_account.key(),
            BET_AMOUNT,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.player.to_account_info(),
                ctx.accounts.base_account.to_account_info(),
            ],
        )?;

        Ok(())
    }

    // TODO: do this a functions to check both player0 and player1
    // TODO: check that player0 and player1 are not the same!!!
    pub fn accept_bets(ctx: Context<AcceptBets>, bump: u8, seed: Vec<u8>) -> Result<()> {
        let accepted_bets_account: &mut Account<AcceptedBetsAccount> =
            &mut ctx.accounts.accepted_bets_account;
        let player0_bet_account: &mut Account<BetAccount> = &mut ctx.accounts.player0_bet_account;
        let player1_bet_account: &mut Account<BetAccount> = &mut ctx.accounts.player1_bet_account;
        let server: &mut Signer = &mut ctx.accounts.server;
        // msg!("server: {:?}", server.to_account_info().lamports());

        let rent = Rent::default();
        let rent_amount = player0_bet_account.to_account_info().lamports() - BET_AMOUNT;

        let is_exempt = Rent::is_exempt(&rent, rent_amount, BetAccount::LEN);
        if !is_exempt {
            return Err(error!(ErrorCode::BetAccountNotEnoughLamports));
        }

        accepted_bets_account.player0 = player0_bet_account.player;
        accepted_bets_account.player1 = player1_bet_account.player;
        accepted_bets_account.bump = bump;

        let server_fee = Rent::minimum_balance(&rent, AcceptedBetsAccount::LEN);
        let all_lamports = player0_bet_account.to_account_info().lamports()
            + player1_bet_account.to_account_info().lamports();
        let diff_all_fee = all_lamports - server_fee;

        **server.to_account_info().lamports.borrow_mut() += server_fee;
        **accepted_bets_account
            .to_account_info()
            .lamports
            .borrow_mut() += diff_all_fee;

        **player0_bet_account.to_account_info().lamports.borrow_mut() = 0;
        **player1_bet_account.to_account_info().lamports.borrow_mut() = 0;

        // msg!("server: {:?}", server.to_account_info().lamports());
        // return Err(error!(ErrorCode::Debugging));
        Ok(())
    }

    // TODO: check in the beginnig if both players are in the account
    // TODO: check remaning sols in accepted_bets_account
    pub fn close_game_with_winner(
        ctx: Context<CloseGameWithWinner>,
        bump: u8,
        seed: Vec<u8>,
        winner: u8,
        arweave: String,
    ) -> Result<()> {
        if arweave.chars().count() != ARWEAVE_ID_LENGTH {
            return Err(ErrorCode::ArweaveIDWrong.into());
        }

        let accepted_bets_account = &mut ctx.accounts.accepted_bets_account;
        let game_closed_account = &mut ctx.accounts.game_closed_account;

        let player0 = &mut ctx.accounts.player0;
        let player1 = &mut ctx.accounts.player1;

        let treasury = &mut ctx.accounts.treasury;

        let winners_amount = accepted_bets_account.to_account_info().lamports();
        **accepted_bets_account
            .to_account_info()
            .lamports
            .borrow_mut() = 0;
        if winner == 0 && accepted_bets_account.player0 == player0.key() {
            **player0.to_account_info().lamports.borrow_mut() += winners_amount;
        } else if winner == 1 && accepted_bets_account.player1 == player1.key() {
            **player1.to_account_info().lamports.borrow_mut() += winners_amount;
        }

        game_closed_account.player0 = player0.key();
        game_closed_account.player1 = player1.key();
        game_closed_account.bump = bump;
        game_closed_account.winner_index = winner;
        game_closed_account.arweave = arweave;

        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("The bet account doesn't have enough lamports")]
    BetAccountNotEnoughLamports,
    #[msg("Just debugging")]
    Debugging,
    #[msg("Arweave ID must have 43 chars")]
    ArweaveIDWrong,
}
