use anchor_lang::prelude::*;
use inco_lightning::cpi::{e_add, e_sub, e_ge, e_select, new_euint128};
use inco_lightning::types::Euint128;
use inco_lightning::cpi::accounts::Operation;
use inco_lightning::ID as INCO_LIGHTNING_ID;

use inco_token::cpi::accounts::TransferChecked;
use inco_token::cpi::transfer_checked;


declare_id!("MTEXkxhfcwDkx1dKNDmmvx22kLDe561hwCjYjkyNYin");

#[program]
pub mod confidential_economic_engine {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
       
       let vault = &mut ctx.accounts.fee_vault;

       vault.authority = ctx.accounts.authority.key();
       vault.token_mint =  ctx.accounts.token_mint.key();
       vault.vault_token_account =  ctx.accounts.vault_token_account.key();
       vault.total_fees_handle = 0u128;
       vault.pending_distribution_handle = 0u128;
       vault.is_closed = false;
       vault.bump = ctx.bumps.fee_vault;
       Ok(())

    }

    pub fn collect_fee(
        ctx: Context<CollectFee>,
        encrypted_amount: Vec<u8>,
        decimals: u8,
    ) -> Result<()>{

        let cpi_ctx = CpiContext::new(
            ctx.accounts.inco_token_program.to_account_info(),
            TransferChecked {
                source: ctx.accounts.from_token.to_account_info(),
                mint: ctx.accounts.token_mint.to_account_info(),
                destination: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
                inco_lightning_program: ctx.accounts.inco_lightning_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            }
        );

        transfer_checked(
            cpi_ctx,
            encrypted_amount.clone(),
            0,
            decimals,
        )?;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.inco_lightning_program.to_account_info(),
            Operation {
                signer: ctx.accounts.payer.to_account_info(),
            },
        );

        let amount: Euint128 = new_euint128(cpi_ctx, encrypted_amount, 0)?;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.inco_lightning_program.to_account_info(),
            Operation {
                signer: ctx.accounts.payer.to_account_info(),
            },
        );

        let updated_total = e_add(cpi_ctx, 
            Euint128(ctx.accounts.fee_vault.total_fees_handle),
            amount,
            0
        )?;

        ctx.accounts.fee_vault.total_fees_handle = updated_total.0;

        Ok(())
    }


    pub fn distribute(
        ctx: Context<Distribute>,
        encrypted_requested: Vec<u8>,
        decimals: u8,
    ) -> Result<()>{


        let cpi_ctx = CpiContext::new(
            ctx.accounts.inco_lightning_program.to_account_info(),
            Operation{
                signer: ctx.accounts.authority.to_account_info(),
            }
        );

        let requested : Euint128 = new_euint128(cpi_ctx, encrypted_requested.clone(), 0)?;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.inco_lightning_program.to_account_info(),
            Operation{
                signer: ctx.accounts.authority.to_account_info(),
            }
        );

        let remaining = e_sub(
            cpi_ctx,
            Euint128(ctx.accounts.fee_vault.total_fees_handle),
            Euint128(ctx.accounts.fee_vault.pending_distribution_handle),
            0
        )?;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.inco_lightning_program.to_account_info(),
            Operation{
                signer: ctx.accounts.authority.to_account_info(),
            }
        );

        let can_distribute = e_ge(
            cpi_ctx,
            remaining,
            requested,
            0
        )?;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.inco_lightning_program.to_account_info(),
            Operation{
                signer: ctx.accounts.authority.to_account_info(),
            }
        );

        let actual = e_select(
            cpi_ctx,
            can_distribute,
            requested,
            remaining,
            0
        )?;

        let token_cpi_ctx = CpiContext::new(
            ctx.accounts.inco_token_program.to_account_info(),
            TransferChecked {
                source: ctx.accounts.vault_token_account.to_account_info(),
                mint: ctx.accounts.token_mint.to_account_info(),
                destination: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                inco_lightning_program: ctx.accounts.inco_lightning_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            }   
        );

        transfer_checked(
            token_cpi_ctx,
            encrypted_requested,
            0,
            decimals,
        )?;
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.inco_lightning_program.to_account_info(),
            Operation{
                signer: ctx.accounts.authority.to_account_info(),
            }
        );


        let new_pending = e_add(
            cpi_ctx,
            Euint128(ctx.accounts.fee_vault.pending_distribution_handle),
            actual,
            0,
        )?;

        ctx.accounts.fee_vault.pending_distribution_handle = new_pending.0;

        Ok(())
    }

    pub fn settle_epoch(ctx: Context<SettleEpoch>) -> Result<()> {
        ctx.accounts.fee_vault.total_fees_handle = 0;
        ctx.accounts.fee_vault.pending_distribution_handle = 0;
        ctx.accounts.fee_vault.is_closed = true;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize <'info>{
    
    #[account(mut)]
    pub authority: Signer<'info>,
   
    /// CHECK: Token mint for which the fee vault is being created
    pub token_mint: AccountInfo<'info>,
    
    /// CHECK: Token account that will hold the fees
    pub vault_token_account: AccountInfo<'info>,
    
    
    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<FeeVault>(),
        seeds = [b"fee_vault", token_mint.key().as_ref()],
        bump,
    )]
    pub fee_vault: Account<'info, FeeVault>,
    

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CollectFee<'info> {

    pub payer : Signer<'info>,
    
    #[account(mut)]
    pub fee_vault: Account<'info, FeeVault>,
    
    /// CHECK: Token account from which fees are collected
    #[account(mut)]
    pub from_token: AccountInfo<'info>,
    
    /// CHECK: Token account to which fees are sent
    #[account(mut)]
    pub vault_token_account: AccountInfo<'info>,

    /// CHECK: Token mint for which fees are being collected
    pub token_mint: AccountInfo<'info>,
    
    /// CHECK: Inco Token program for token transfers
    pub inco_token_program: AccountInfo<'info>,
    

    /// CHECK: Inco Lightning program for encrypted operations
    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: AccountInfo<'info>,

    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Distribute<'info>{

    pub authority: Signer<'info>,
    
    /// CHECK: Fee vault from which fees are distributed
    #[account(mut, has_one = authority)]
    pub fee_vault: Account<'info, FeeVault>,
    
    /// CHECK: Token account from which fees are distributed
    #[account(mut)]
    pub vault_token_account: AccountInfo<'info>,
    
    /// CHECK: Token mint for which fees are being distributed
    #[account(mut)]
    pub recipient_token_account: AccountInfo<'info>,

    /// CHECK
    pub token_mint: AccountInfo<'info>,

    /// CHECK
    pub inco_token_program: AccountInfo<'info>,

    /// CHECK: Inco Lightning program for encrypted operations
    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

}


#[derive(Accounts)]
pub struct SettleEpoch<'info> {
    pub authority: Signer<'info>,

    #[account(mut, has_one = authority)]
    pub fee_vault: Account<'info, FeeVault>,
}


#[account]
pub struct FeeVault {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub vault_token_account: Pubkey,
    pub total_fees_handle: u128,  // encrypted total fees collected handle as u128, not Euint128
    pub pending_distribution_handle: u128, // encrypted pending distribution handle as u128, not Euint128
    pub is_closed: bool,
    pub bump: u8,
}
