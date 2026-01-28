# Fix: Cargo Edition2024 Error with Anchor Build

## Problem

When running `anchor build`, the build failed with this error:

```
error: failed to parse manifest at `.../constant_time_eq-0.4.2/Cargo.toml`

Caused by:
  feature `edition2024` is required

  The package requires the Cargo feature called `edition2024`, but that feature is 
  not stabilized in this version of Cargo (1.84.0).
```

## Root Cause

1. The crate `constant_time_eq v0.4.2` was published to crates.io with `edition = "2024"` in its manifest
2. This crate was a transitive dependency through: `blake3 v1.8.3` → `constant_time_eq v0.4.2`
3. Rust edition 2024 is not yet stabilized in Cargo versions < 1.95.0
4. Even with nightly Rust, the downloaded crate's manifest couldn't be parsed by older Cargo versions

## Why Standard Solutions Didn't Work

- **Updating Rust to nightly**: The issue wasn't with the Rust compiler, but with the published crate's manifest on crates.io
- **Patching `constant_time_eq` directly**: Cargo doesn't allow patching to the same source (crates.io)
- **`rust-toolchain.toml` override**: The project had `rust-toolchain.toml` pinning a specific version, which overrode `rustup default` commands

## Solution

Patch the parent dependency (`blake3`) to use an older version that depends on `constant_time_eq v0.3.1` instead:

### Step 1: Update `rust-toolchain.toml`

```toml
[toolchain]
channel = "stable"
components = ["rustfmt","clippy"]
profile = "minimal"
```

### Step 2: Update `Cargo.toml` (workspace root)

Add or modify the `[patch.crates-io]` section:

```toml
[patch.crates-io]
blake3 = { git = "https://github.com/BLAKE3-team/BLAKE3.git", tag = "1.5.5" }
```

### Step 3: Clean and Rebuild

```bash
rm -rf Cargo.lock ~/.cargo/registry
anchor build
```

## Why This Works

- `blake3 v1.5.5` uses `constant_time_eq v0.3.1` (edition 2021) instead of v0.4.2 (edition 2024)
- Using git source instead of crates.io is allowed by Cargo's patch mechanism
- The git-based patch replaces all references to `blake3` throughout the dependency tree

## Verification

After applying the fix, you should see in build output:

```
Compiling blake3 v1.5.5 (https://github.com/BLAKE3-team/BLAKE3.git?tag=1.5.5#81f772a4)
Compiling constant_time_eq v0.3.1
```

Build completes successfully without edition2024 errors.

## Alternative Solutions

If this specific fix doesn't work for your case:

1. **Wait for Cargo update**: Use Cargo 1.95.0+ when edition2024 is stabilized
2. **Patch other dependencies**: Find which crate pulls in the problematic dependency using `cargo tree -i constant_time_eq`
3. **Downgrade anchor-lang**: Use an older Anchor version that doesn't depend on newer `blake3`
