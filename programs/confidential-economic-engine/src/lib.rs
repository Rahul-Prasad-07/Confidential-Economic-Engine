use anchor_lang::prelude::*;

declare_id!("BpZDexTuoFCrLyxEkD7tv2jRotJGVtCpyuhDReeWvEN4");

#[program]
pub mod confidential_economic_engine {
    use super::*;

    pub fn initialize_desk(
        ctx: Context<InitializeDesk>,
        max_notional_per_execution: u64,
        max_slippage_bps: u16,
        daily_notional_cap: u64,
    ) -> Result<()> {
        require!(max_slippage_bps <= 10_000, ErrorCode::InvalidSlippageBps);
        require!(
            max_notional_per_execution <= daily_notional_cap,
            ErrorCode::InvalidPolicyBounds
        );

        let desk = &mut ctx.accounts.desk_config;
        desk.authority = ctx.accounts.authority.key();
        desk.max_notional_per_execution = max_notional_per_execution;
        desk.max_slippage_bps = max_slippage_bps;
        desk.daily_notional_cap = daily_notional_cap;
        desk.consumed_today = 0;
        desk.current_day_index = day_index(Clock::get()?.unix_timestamp);
        desk.last_settlement_id = 0;
        desk.halted = false;
        desk.bump = ctx.bumps.desk_config;
        Ok(())
    }

    pub fn update_policy(
        ctx: Context<UpdatePolicy>,
        max_notional_per_execution: u64,
        max_slippage_bps: u16,
        daily_notional_cap: u64,
    ) -> Result<()> {
        require!(max_slippage_bps <= 10_000, ErrorCode::InvalidSlippageBps);
        require!(
            max_notional_per_execution <= daily_notional_cap,
            ErrorCode::InvalidPolicyBounds
        );

        let desk = &mut ctx.accounts.desk_config;
        desk.max_notional_per_execution = max_notional_per_execution;
        desk.max_slippage_bps = max_slippage_bps;
        desk.daily_notional_cap = daily_notional_cap;
        Ok(())
    }

    pub fn set_halt(ctx: Context<SetHalt>, halted: bool) -> Result<()> {
        ctx.accounts.desk_config.halted = halted;
        Ok(())
    }

    pub fn open_private_intent(
        ctx: Context<OpenPrivateIntent>,
        session_id: u64,
        intent_commitment: [u8; 32],
        requested_notional_cap: u64,
        requested_slippage_bps: u16,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let desk = &ctx.accounts.desk_config;

        require!(!desk.halted, ErrorCode::DeskHalted);
        require!(
            requested_notional_cap <= desk.max_notional_per_execution,
            ErrorCode::NotionalAboveDeskPolicy
        );
        require!(
            requested_slippage_bps <= desk.max_slippage_bps,
            ErrorCode::SlippageAboveDeskPolicy
        );

        let session = &mut ctx.accounts.intent_session;
        session.desk = desk.key();
        session.agent = ctx.accounts.agent.key();
        session.session_id = session_id;
        session.intent_commitment = intent_commitment;
        session.quote_commitment = [0u8; 32];
        session.requested_notional_cap = requested_notional_cap;
        session.requested_slippage_bps = requested_slippage_bps;
        session.settlement_amount = 0;
        session.realized_slippage_bps = 0;
        session.settlement_ref = [0u8; 32];
        session.status = SessionStatus::Open as u8;
        session.cancel_reason = 0;
        session.created_at = clock.unix_timestamp;
        session.updated_at = clock.unix_timestamp;
        session.bump = ctx.bumps.intent_session;

        emit!(PrivateIntentOpened {
            desk: desk.key(),
            session: session.key(),
            agent: ctx.accounts.agent.key(),
            session_id,
            opened_at: clock.unix_timestamp,
        });

        Ok(())
    }

    pub fn submit_private_quote(
        ctx: Context<SubmitPrivateQuote>,
        _session_id: u64,
        quote_commitment: [u8; 32],
    ) -> Result<()> {
        let session = &mut ctx.accounts.intent_session;
        let now = Clock::get()?.unix_timestamp;
        require!(
            session.status == SessionStatus::Open as u8,
            ErrorCode::InvalidSessionState
        );

        session.quote_commitment = quote_commitment;
        session.status = SessionStatus::Quoted as u8;
        session.updated_at = now;

        emit!(PrivateQuoteSubmitted {
            desk: session.desk,
            session: session.key(),
            session_id: session.session_id,
            quoted_at: now,
        });

        Ok(())
    }

    pub fn settle_private_execution(
        ctx: Context<SettlePrivateExecution>,
        _session_id: u64,
        settlement_amount: u64,
        realized_slippage_bps: u16,
        settlement_ref: [u8; 32],
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let current_day = day_index(now);

        let desk = &mut ctx.accounts.desk;
        require!(!desk.halted, ErrorCode::DeskHalted);

        let session = &mut ctx.accounts.intent_session;
        require!(
            session.status == SessionStatus::Quoted as u8,
            ErrorCode::InvalidSessionState
        );
        require!(
            settlement_amount <= session.requested_notional_cap,
            ErrorCode::SettlementAboveSessionCap
        );
        require!(
            realized_slippage_bps <= session.requested_slippage_bps,
            ErrorCode::SlippageAboveSessionPolicy
        );
        require!(
            realized_slippage_bps <= desk.max_slippage_bps,
            ErrorCode::SlippageAboveDeskPolicy
        );

        if desk.current_day_index != current_day {
            desk.current_day_index = current_day;
            desk.consumed_today = 0;
        }

        let updated_consumed = desk
            .consumed_today
            .checked_add(settlement_amount)
            .ok_or(ErrorCode::MathOverflow)?;
        require!(
            updated_consumed <= desk.daily_notional_cap,
            ErrorCode::DailyCapExceeded
        );

        desk.consumed_today = updated_consumed;
        desk.last_settlement_id = desk
            .last_settlement_id
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;

        session.settlement_amount = settlement_amount;
        session.realized_slippage_bps = realized_slippage_bps;
        session.settlement_ref = settlement_ref;
        session.status = SessionStatus::Settled as u8;
        session.updated_at = now;

        emit!(PrivateExecutionSettled {
            desk: desk.key(),
            session: session.key(),
            settlement_id: desk.last_settlement_id,
            session_id: session.session_id,
            settled_at: now,
        });

        Ok(())
    }

    pub fn cancel_session(
        ctx: Context<CancelSession>,
        _session_id: u64,
        reason_code: u16,
    ) -> Result<()> {
        let session = &mut ctx.accounts.intent_session;
        require!(
            session.status == SessionStatus::Open as u8
                || session.status == SessionStatus::Quoted as u8,
            ErrorCode::InvalidSessionState
        );

        session.status = SessionStatus::Canceled as u8;
        session.cancel_reason = reason_code;
        session.updated_at = Clock::get()?.unix_timestamp;

        emit!(PrivateExecutionCanceled {
            desk: session.desk,
            session: session.key(),
            session_id: session.session_id,
            canceled_at: session.updated_at,
            reason_code,
        });

        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum SessionStatus {
    Open = 1,
    Quoted = 2,
    Settled = 3,
    Canceled = 4,
}

#[derive(Accounts)]
pub struct InitializeDesk<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + DeskConfig::LEN,
        seeds = [b"desk_config", authority.key().as_ref()],
        bump,
    )]
    pub desk_config: Account<'info, DeskConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub desk_config: Account<'info, DeskConfig>,
}

#[derive(Accounts)]
pub struct SetHalt<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub desk_config: Account<'info, DeskConfig>,
}

#[derive(Accounts)]
#[instruction(session_id: u64)]
pub struct OpenPrivateIntent<'info> {
    pub agent: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub desk_config: Account<'info, DeskConfig>,
    #[account(
        init,
        payer = payer,
        space = 8 + IntentSession::LEN,
        seeds = [
            b"intent_session",
            desk_config.key().as_ref(),
            &session_id.to_le_bytes()
        ],
        bump
    )]
    pub intent_session: Account<'info, IntentSession>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(session_id: u64)]
pub struct SubmitPrivateQuote<'info> {
    pub authority: Signer<'info>,
    #[account(has_one = authority)]
    pub desk: Account<'info, DeskConfig>,
    #[account(
        mut,
        seeds = [
            b"intent_session",
            desk.key().as_ref(),
            &session_id.to_le_bytes()
        ],
        bump = intent_session.bump,
        has_one = desk
    )]
    pub intent_session: Account<'info, IntentSession>,
}

#[derive(Accounts)]
#[instruction(session_id: u64)]
pub struct SettlePrivateExecution<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub desk: Account<'info, DeskConfig>,
    #[account(
        mut,
        seeds = [
            b"intent_session",
            desk.key().as_ref(),
            &session_id.to_le_bytes()
        ],
        bump = intent_session.bump,
        has_one = desk
    )]
    pub intent_session: Account<'info, IntentSession>,
}

#[derive(Accounts)]
#[instruction(session_id: u64)]
pub struct CancelSession<'info> {
    pub authority: Signer<'info>,
    #[account(has_one = authority)]
    pub desk: Account<'info, DeskConfig>,
    #[account(
        mut,
        seeds = [
            b"intent_session",
            desk.key().as_ref(),
            &session_id.to_le_bytes()
        ],
        bump = intent_session.bump,
        has_one = desk
    )]
    pub intent_session: Account<'info, IntentSession>,
}

#[account]
pub struct DeskConfig {
    pub authority: Pubkey,
    pub max_notional_per_execution: u64,
    pub max_slippage_bps: u16,
    pub daily_notional_cap: u64,
    pub consumed_today: u64,
    pub current_day_index: i64,
    pub last_settlement_id: u64,
    pub halted: bool,
    pub bump: u8,
}

impl DeskConfig {
    pub const LEN: usize = 32 + 8 + 2 + 8 + 8 + 8 + 8 + 1 + 1;
}

#[account]
pub struct IntentSession {
    pub desk: Pubkey,
    pub agent: Pubkey,
    pub session_id: u64,
    pub intent_commitment: [u8; 32],
    pub quote_commitment: [u8; 32],
    pub requested_notional_cap: u64,
    pub requested_slippage_bps: u16,
    pub settlement_amount: u64,
    pub realized_slippage_bps: u16,
    pub settlement_ref: [u8; 32],
    pub status: u8,
    pub cancel_reason: u16,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl IntentSession {
    pub const LEN: usize = 32 + 32 + 8 + 32 + 32 + 8 + 2 + 8 + 2 + 32 + 1 + 2 + 8 + 8 + 1;
}

#[event]
pub struct PrivateIntentOpened {
    pub desk: Pubkey,
    pub session: Pubkey,
    pub agent: Pubkey,
    pub session_id: u64,
    pub opened_at: i64,
}

#[event]
pub struct PrivateQuoteSubmitted {
    pub desk: Pubkey,
    pub session: Pubkey,
    pub session_id: u64,
    pub quoted_at: i64,
}

#[event]
pub struct PrivateExecutionSettled {
    pub desk: Pubkey,
    pub session: Pubkey,
    pub settlement_id: u64,
    pub session_id: u64,
    pub settled_at: i64,
}

#[event]
pub struct PrivateExecutionCanceled {
    pub desk: Pubkey,
    pub session: Pubkey,
    pub session_id: u64,
    pub canceled_at: i64,
    pub reason_code: u16,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid slippage bps value")]
    InvalidSlippageBps,
    #[msg("Policy max notional must be <= daily cap")]
    InvalidPolicyBounds,
    #[msg("Desk is halted")]
    DeskHalted,
    #[msg("Requested notional exceeds desk policy")]
    NotionalAboveDeskPolicy,
    #[msg("Requested slippage exceeds desk policy")]
    SlippageAboveDeskPolicy,
    #[msg("Session is not in a valid state for this operation")]
    InvalidSessionState,
    #[msg("Settlement amount exceeds session notional cap")]
    SettlementAboveSessionCap,
    #[msg("Settlement slippage exceeds session policy")]
    SlippageAboveSessionPolicy,
    #[msg("Daily notional cap exceeded")]
    DailyCapExceeded,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}

fn day_index(unix_ts: i64) -> i64 {
    unix_ts.div_euclid(86_400)
}
