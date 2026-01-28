# Inco Lightning Integration Guide

## Problem Summary

When integrating `inco-lightning` crate into an Anchor Solana program, you encountered compilation errors related to:

1. **Euint128 serialization errors** - `Euint128` doesn't implement Anchor's serialization traits
2. **Version mismatch** - Different versions of `anchor-lang` between your program and inco-lightning dependency

## Root Causes

### Issue 1: Euint128 Serialization

`Euint128` is a wrapper type around `u128` from inco-lightning that represents an encrypted value **handle**. It cannot be directly serialized/deserialized by Anchor because it doesn't implement the required `AnchorSerialize` and `AnchorDeserialize` traits.

**Error Example:**
```
error[E0599]: no function or associated item named `get_full_path` found for struct 
`inco_lightning::Euint128`
```

### Issue 2: Anchor Version Mismatch

- Your program used `anchor-lang = "0.30.0"` 
- `inco-lightning v0.1.4` depends on `anchor-lang v0.31.1`
- Cargo couldn't reconcile the two different versions, causing trait mismatch errors

**Error Example:**
```
note: there are multiple different versions of crate `anchor_lang` in the dependency graph
= note: this is the found trait (from v0.31.1)
= note: this is the required trait (from v0.30.0)
```

## Solutions Applied

### 1. Store Handles as `u128`, Not `Euint128`

**Pattern:** Keep handles on-chain as `u128` (16 bytes), not `Euint128`

```rust
// WRONG: Cannot serialize Euint128
#[account]
pub struct FeeBox {
    pub amount: Euint128,  // ❌ Doesn't implement serialization
}

// RIGHT: Store handle as u128
#[account]
pub struct FeeBox {
    pub owner: Pubkey,
    pub amount: u128,  // ✅ 16 bytes = handle only
}
```

### 2. Convert Ciphertext to Handles via CPI

When receiving encrypted input, create a `Euint128` handle via CPI, then store only the `u128` handle value:

```rust
pub fn accept_encrypted_input(
    ctx: Context<AcceptedEncrypted>,
    amount: Vec<u8>,  // Client-encrypted ciphertext from JS SDK
) -> Result<()> {
    // Create CPI context for Inco Lightning
    let cpi_ctx = CpiContext::new(
        ctx.accounts.inco_lightning_program.to_account_info(),
        Operation {
            signer: ctx.accounts.owner.to_account_info(),
        },
    );

    // Convert ciphertext to encrypted handle
    let encrypted_amount: Euint128 = new_euint128(cpi_ctx, amount, 0)?;
    
    // Store only the handle (u128 value)
    ctx.accounts.fee_box.amount = encrypted_amount.0;
    Ok(())
}
```

### 3. Update Anchor Versions to Match

Sync your program's Anchor version with inco-lightning's dependency:

**In `programs/confidential-economic-engine/Cargo.toml`:**
```toml
[dependencies]
anchor-lang = "0.31.1"   # Changed from 0.30.0
anchor-spl = "0.31.1"    # Changed from 0.30.0
inco-lightning = { version = "0.1.4", features = ["cpi"] }
```

### 4. Include Inco Lightning Program in Accounts

Add the Inco Lightning program account to any instruction that performs encrypted operations:

```rust
#[derive(Accounts)]
pub struct AcceptedEncrypted<'info> {
    #[account(mut, has_one = owner)]
    pub fee_box: Account<'info, FeeBox>,

    pub owner: Signer<'info>,

    /// CHECK: Inco Lightning program for encrypted operations
    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: AccountInfo<'info>,
}
```

## Key Concepts from Inco Lightning

### Encrypted Handles

- **Handle:** A 16-byte (`u128`) identifier for an encrypted value
- **Ciphertext:** The actual encrypted bytes (stored off-chain)
- **Storage:** Always store handles (`u128`) on-chain, not ciphertext

### Account Structure Best Practices

```rust
#[account]
pub struct SecureVault {
    pub owner: Pubkey,              // 32 bytes
    pub balance: u128,              // 16 bytes (handle only!)
    pub bump: u8,                   // 1 byte
    // Total: 49 bytes (compact and efficient)
}
```

### CPI Pattern for Operations

All encrypted operations follow this pattern:

```rust
let cpi_ctx = CpiContext::new(
    ctx.accounts.inco_lightning_program.to_account_info(),
    Operation {
        signer: ctx.accounts.authority.to_account_info(),
    },
);

// Call operation (arithmetic, comparison, etc)
let result: Euint128 = operation_function(cpi_ctx, operands, 0)?;

// Store handle only
ctx.accounts.account.value = result.0;
```

## Testing Your Integration

```bash
# Build the program
anchor build

# Run tests
anchor test

# Deploy locally
anchor deploy
```

## Next Steps

1. **Implement Access Control**: Use `allow()` to grant decryption permissions
2. **Client Integration**: Use JS SDK to encrypt inputs and decrypt outputs
3. **Operations**: Implement encrypted arithmetic (e_add, e_sub, etc)
4. **Security**: Follow the Best Practices guide from Inco docs

## Troubleshooting

| Error | Solution |
|-------|----------|
| `Euint128` doesn't implement trait | Store as `u128`, not `Euint128` |
| Version mismatch on `anchor-lang` | Update to 0.31.1 in `Cargo.toml` |
| CPI context type mismatch | Ensure Inco program account is included |
| Compilation fails on account structs | Remove `Euint128` from derives, use `u128` |

## References

- [Inco Lightning Rust SDK](https://docs.inco.org/svm/rust-sdk/overview)
- [Input & Encryption](https://docs.inco.org/svm/rust-sdk/input-encryption)
- [Operations](https://docs.inco.org/svm/rust-sdk/operations)
- [Access Control](https://docs.inco.org/svm/rust-sdk/access-control)
- [Best Practices](https://docs.inco.org/svm/rust-sdk/best-practices)
