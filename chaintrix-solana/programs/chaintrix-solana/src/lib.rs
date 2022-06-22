use anchor_lang::prelude::*;
use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;

use account::*;
use context::*;

mod account;
mod context;

const BET_AMOUNT: u64 = LAMPORTS_PER_SOL / 10; // 0.1 sol
const TREASURY_AMOUNT: u64 = LAMPORTS_PER_SOL / 100;

declare_id!("Agi74KZH6XY5fKPycWtg9X5g4RgfPZpNNmKodLCXDA7q");

#[program]
pub mod chaintrix_solana {
    use super::*;

    pub fn bet(ctx: Context<Bet>, bump: u8, seed: Vec<u8>) -> Result<()> {
        let bet_account: &mut Account<BetAccount> = &mut ctx.accounts.bet_account;
        let player_account = &mut ctx.accounts.player;

        bet_account.bump = bump;
        bet_account.player = player_account.key();

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.player.key(),
            &ctx.accounts.bet_account.key(),
            BET_AMOUNT,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.player.to_account_info(),
                ctx.accounts.bet_account.to_account_info(),
            ],
        )?;

        Ok(())
    }

    pub fn close_bet_without_playing(ctx: Context<CloseBetWithoutPlaying>) -> Result<()> {
        let bet_account = &mut ctx.accounts.bet_account;
        let player = &mut ctx.accounts.player;

        if bet_account.player != player.key() {
            return Err(ErrorCode::WrongAccounts.into());
        }

        let amount_to_return = bet_account.to_account_info().lamports();
        **bet_account.to_account_info().lamports.borrow_mut() = 0;
        **player.to_account_info().lamports.borrow_mut() += amount_to_return;
        Ok(())
    }

    pub fn accept_bets(ctx: Context<AcceptBets>, bump: u8, seed: Vec<u8>) -> Result<()> {
        let accepted_bets_account: &mut Account<AcceptedBetsAccount> =
            &mut ctx.accounts.accepted_bets_account;
        let player0_bet_account: &mut Account<BetAccount> = &mut ctx.accounts.player0_bet_account;
        let player1_bet_account: &mut Account<BetAccount> = &mut ctx.accounts.player1_bet_account;
        let server: &mut Signer = &mut ctx.accounts.server;

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

        Ok(())
    }

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

        if winner != 0 && winner != 1 && winner != 255 {
            return Err(ErrorCode::WrongParameters.into());
        }

        let accepted_bets_account = &mut ctx.accounts.accepted_bets_account;
        let player0 = &mut ctx.accounts.player0;
        let player1 = &mut ctx.accounts.player1;
        if accepted_bets_account.player0 != player0.key()
            || accepted_bets_account.player1 != player1.key()
        {
            return Err(ErrorCode::CloseGameWrongAccounts.into());
        }

        let game_closed_account = &mut ctx.accounts.game_closed_account;
        let treasury = &mut ctx.accounts.treasury;

        let rent = Rent::default();
        let server_fee = Rent::minimum_balance(&rent, GameClosedAccount::LEN);
        let lamports_to_split = accepted_bets_account.to_account_info().lamports() - server_fee;
        let lamports_winner = lamports_to_split - TREASURY_AMOUNT;
        **accepted_bets_account
            .to_account_info()
            .lamports
            .borrow_mut() = 0;

        **(&mut ctx.accounts.server)
            .to_account_info()
            .lamports
            .borrow_mut() += server_fee;

        if winner == 0 {
            **player0.to_account_info().lamports.borrow_mut() += lamports_winner;
            **treasury.to_account_info().lamports.borrow_mut() += TREASURY_AMOUNT;
        } else if winner == 1 {
            **player1.to_account_info().lamports.borrow_mut() += lamports_winner;
            **treasury.to_account_info().lamports.borrow_mut() += TREASURY_AMOUNT;
        } else if winner == 255 {
            **player0.to_account_info().lamports.borrow_mut() += lamports_to_split / 2;
            **player1.to_account_info().lamports.borrow_mut() += lamports_to_split / 2;
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
    #[msg("Accounts do not fit")]
    WrongAccounts,
    #[msg("Wrong parameters")]
    WrongParameters,
    #[msg("Arweave ID must have 43 chars")]
    ArweaveIDWrong,
    #[msg("Closing bets: the accounts are not coresponding to playing accounts")]
    CloseGameWrongAccounts,
}
