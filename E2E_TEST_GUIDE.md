# CEE Phase-5 E2E Test Guide

## What This Test Does

This is a **complete, production-ready E2E test** that proves:

✅ Encrypted fee collection works  
✅ Encrypted distribution with clamping logic  
✅ Decryption access control enforced  
✅ Plaintext recovery via Inco covalidator  
✅ No information leakage through control flow  
✅ Token-2022 confidential transfer integration  

## Prerequisites

Before running the tests:

```bash
# 1. Install dependencies
yarn install

# 2. Build the program
anchor build

# 3. Ensure you have a local Solana validator running
# OR use devnet/mainnet (configure in Anchor.toml)
solana-test-validator
```

## Configuration

### Update Anchor.toml

Ensure your `Anchor.toml` points to the correct cluster:

```toml
[provider]
cluster = "localnet"  # or "devnet" / "mainnet"
wallet = "~/.config/solana/id.json"
```

### Update Program IDs in Test

The test file references these program IDs. **Update them if using different deployments**:

```typescript
// In tests/confidential-economic-engine.ts

const CONFIDENTIAL_TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBP6xs3bGSo"  // <-- Token-2022 on Devnet
);

const INCO_LIGHTNING_PROGRAM_ID = new PublicKey(
  "5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj"  // <-- Inco on Devnet
);
```

**To find your deployed Token-2022 and CEE program IDs:**

```bash
# Get your CEE program ID
anchor keys list

# Get Token-2022 from your deployment output or Inco docs
```

## Running the Tests

### Option 1: Full Test Suite (Local Validator)

```bash
# Terminal 1: Start local validator
solana-test-validator

# Terminal 2: Run full E2E tests
anchor test

# Expected output:
# CEE – Phase-5 Full E2E Integration
#   ✓ Airdrop SOL to all users
#   ✓ Create confidential token mint
#   ✓ Create token accounts for Alice, Bob, and Vault
#   ✓ Initialize FeeVault PDA
#   ✓ Alice pays encrypted fee (40 tokens)
#   ✓ Bob pays encrypted fee (50 tokens)
#   ✓ Authority distributes encrypted payout to Bob (30 tokens)
#   ✓ Grant Bob decryption permission via allowance PDA
#   ✓ Bob decrypts pending distribution (should be 30 tokens)
#   ✓ Verify total fees are not directly decryptable
#   ✓ Settle epoch (close vault)
#   ✓ Summary: Proof of Confidential Transfers
```

### Option 2: Against Devnet

```bash
# Update Anchor.toml
sed -i 's/cluster = "localnet"/cluster = "devnet"/' Anchor.toml

# Deploy to devnet
anchor deploy

# Run tests against devnet
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com anchor test --skip-deploy
```

### Option 3: Run Specific Test

```bash
# Run only the fee collection test
yarn mocha -p ./tsconfig.json --grep "Alice pays encrypted fee" tests/confidential-economic-engine.ts

# Run only decryption tests
yarn mocha -p ./tsconfig.json --grep "decrypts" tests/confidential-economic-engine.ts
```

## Test Flow Explanation

### 1. **Setup Phase**
- Airdrop SOL to Alice, Bob, and Authority
- Create confidential token mint (Token-2022)
- Create associated token accounts for each user

### 2. **Initialization**
- Initialize FeeVault PDA with:
  - `total_fees_handle = 0` (encrypted)
  - `pending_distribution_handle = 0` (encrypted)
  - `is_closed = false`

### 3. **Fee Collection** (Encrypted Addition)
- **Alice** pays 40 tokens:
  - Encrypts 40 tokens client-side
  - Calls `collect_fee` with ciphertext
  - Program calls `e_add(total_fees, 40)` via CPI
  - Result stored as `total_fees_handle`
  
- **Bob** pays 50 tokens:
  - Same process: total is now `encrypted(90)`
  - No plaintext ever exposed

### 4. **Distribution** (Encrypted Clamp Logic)
- **Authority** requests 30 tokens for Bob:
  - Encrypts 30 tokens client-side
  - Program computes: `remaining = total - pending` (encrypted)
  - Program checks: `can_distribute = (remaining >= requested)` (encrypted)
  - Program clamps: `actual = select(can_distribute, requested, remaining)` (encrypted)
  - **Key insight:** Authority never learns if 30 > 90 or 30 < 90!
  - Token-2022 transfers encrypted amount to Bob

### 5. **Access Control**
- **Authority** grants Bob permission to decrypt via:
  - Derives allowance PDA: `[handle, bob_pubkey]`
  - Calls `grant_decrypt_access`
  - Bob is now allowed to request decryption from covalidator

### 6. **Decryption & Verification**
- **Bob** decrypts pending distribution:
  - Calls Inco Gateway with his allowance proof
  - Covalidator verifies `is_allowed(handle, bob)` on-chain
  - Covalidator decrypts in TEE
  - Covalidator signs attestation and returns plaintext
  - Bob verifies signature on-chain (if needed)
  - **Result:** 30 tokens confirmed

### 7. **Epoch Settlement**
- **Authority** settles:
  - Resets both handles to 0
  - Sets `is_closed = true`
  - Vault ready for next epoch

## Key Security Properties Proven

| Property | Proof |
|----------|-------|
| **No plaintext leakage** | All operations use encrypted handles |
| **No control-flow leakage** | `e_select` used instead of if/else |
| **No information probing** | Allowance required for decryption |
| **Atomic operations** | All-or-nothing distribution (clamping) |
| **Access enforcement** | Only Bob can decrypt (allowance PDA) |
| **Arithmetic preservation** | Token-2022 math still correct |

## Debugging

### Test Fails on "Encrypt Value"

```bash
# Issue: @inco/solana-sdk not installed
yarn add @inco/solana-sdk

# Or with npm
npm install @inco/solana-sdk
```

### Test Fails on "Decrypt"

```bash
# Issue: Gateway/covalidator not available
# Solutions:
# 1. Ensure you're on devnet or have local covalidator running
# 2. Skip decryption test:
yarn mocha -p ./tsconfig.json --grep -v "decrypts" tests/confidential-economic-engine.ts
```

### Program Deployment Fails

```bash
# Issue: Program ID mismatch
# Solution: Update declare_id! in lib.rs to match Anchor.toml [programs.localnet]
anchor keys sync
```

## Next Steps

After this test passes:

1. **UI Integration:** Build Next.js frontend with encrypted inputs
2. **Threat Model:** Write formal security proof
3. **Extend Features:** Add confidential payroll or prediction market
4. **Optimize:** Reduce CPI count or use batching
5. **Audit:** Submit to professional auditor

## References

- [Inco Lightning Rust SDK](https://docs.inco.org/svm/rust-sdk/overview)
- [Lightning-Rod Solana Repo](https://github.com/Inco-fhevm/lightning-rod-solana)
- [Token-2022 Confidential Extension](https://docs.solana.com/developers/programs/tokens/token-2022/extensions)
- [Anchor Framework Docs](https://www.anchor-lang.com/)

## Contact

For issues or questions about this test:
- File an issue on the GitHub repo
- Check Inco Discord: https://discord.gg/inco
- Review Anchor Discord: https://discord.gg/projectserum
