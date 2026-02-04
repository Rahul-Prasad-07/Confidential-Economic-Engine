import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Connection,
} from "@solana/web3.js";
import { expect } from "chai";
import { encryptValue } from "@inco/solana-sdk";
import { decrypt} from "@inco/solana-sdk";
import { hexToBuffer } from "@inco/solana-sdk";
import incoTokenIdl from "./idl/inco_token.json";
import { ConfidentialEconomicEngine } from "../target/types/confidential_economic_engine";



const CONFIDENTIAL_TOKEN_2022_PROGRAM_ID = new PublicKey(
  "9y5V6sxRGNGCEWETbfuZFjpZPFn7CRCSrcn5rgZbCvSn"
);

// usually auto-filled by Anchor, kept explicit for clarity
const INCO_LIGHTNING_PROGRAM_ID =
  new PublicKey("5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj");


const DECIMALS = 6;
const INPUT_TYPE = 0; // ciphertext


describe("CEE – Full E2E", () => {
 
  const network = process.env.SOLANA_NETWORK || "devnet";
  const rpcUrl = network === "devnet" 
    ? "https://api.devnet.solana.com" 
    : "http://localhost:8899";
  const connection = new Connection(rpcUrl, "confirmed");

  const provider = new anchor.AnchorProvider(
    connection,
    anchor.AnchorProvider.env().wallet,
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const incoTokenProgram = new anchor.Program(
    incoTokenIdl as anchor.Idl,
    provider
  )as any;

  const program = anchor.workspace
    .ConfidentialEconomicEngine as Program<ConfidentialEconomicEngine>;

  const authority = provider.wallet as anchor.Wallet;


  const alice = Keypair.generate();
  const bob = Keypair.generate();

  let mintKp: Keypair;

  let aliceTokenKp: Keypair;
  let vaultTokenKp: Keypair;
  let bobTokenKp: Keypair;

  let feeVault: PublicKey;

 async function airdrop(pubkey: PublicKey) {
    const signature = await connection.requestAirdrop(
      pubkey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction({
      signature,
      blockhash: (await connection.getLatestBlockhash()).blockhash,
      lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
    });
  }

  async function initTokenAccount(kp: Keypair, ownerKp: Keypair) {
    await incoTokenProgram.methods
      .initializeAccount3()
      .accounts({
        account: kp.publicKey,
        mint: mintKp.publicKey,
        authority: ownerKp.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([kp, ownerKp])
      .rpc();
  }

  async function fundAccountFromProvider(
  to: PublicKey,
  lamports = 0.05 * anchor.web3.LAMPORTS_PER_SOL
) {
  const tx = new anchor.web3.Transaction().add(
    anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: to,
      lamports,
    })
  );

  await provider.sendAndConfirm(tx);
}


  it.skip("Airdrop SOL", async () => {
    await airdrop(alice.publicKey);
    await airdrop(bob.publicKey);
  });

  it("Initialize confidential token mint", async () => {
    mintKp = Keypair.generate();

    await incoTokenProgram.methods
      .initializeMint(DECIMALS, authority.publicKey, authority.publicKey)
      .accounts({
        mint: mintKp.publicKey,
        payer: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([mintKp])
      .rpc();
  });

  it("Initialize confidential token accounts", async () => {
    aliceTokenKp = Keypair.generate();
    vaultTokenKp = Keypair.generate();
    bobTokenKp = Keypair.generate();

    // console.log("Alice token account:", aliceTokenKp.publicKey.toBase58());
    // console.log("Vault token account:", vaultTokenKp.publicKey.toBase58());
    // console.log("Bob token account:", bobTokenKp.publicKey.toBase58()); 
  await fundAccountFromProvider(aliceTokenKp.publicKey);
  await fundAccountFromProvider(vaultTokenKp.publicKey);
  await fundAccountFromProvider(bobTokenKp.publicKey);

    await initTokenAccount(aliceTokenKp, alice);
    await initTokenAccount(vaultTokenKp, authority.payer);
    await initTokenAccount(bobTokenKp, bob);
  });

  it("Mint encrypted balance to Alice", async () => {
    const encryptedMint = await encryptValue(
      100n * 10n ** BigInt(DECIMALS)
    );

    await incoTokenProgram.methods
      .mintToChecked(hexToBuffer(encryptedMint), INPUT_TYPE, DECIMALS)
      .accounts({
        mint: mintKp.publicKey,
        account: aliceTokenKp.publicKey,
        authority: authority.publicKey,
      })
      .rpc();
  });

  it("Initialize FeeVault", async () => {
    [feeVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee_vault"), mintKp.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .initialize()
      .accounts({
        authority: authority.publicKey,
        tokenMint: mintKp.publicKey,
        vaultTokenAccount: vaultTokenKp.publicKey,
        feeVault,
        systemProgram: SystemProgram.programId,
      }as any)
      .rpc();

    const vault = await program.account.feeVault.fetch(feeVault);
    expect(vault.totalFeesHandle.toString()).to.equal("0");
  });

  it("Alice pays encrypted fee", async () => {
    const encryptedFee = await encryptValue(40n * 10n ** BigInt(DECIMALS));

    const tx = await program.methods
      .collectFee(hexToBuffer(encryptedFee), DECIMALS)
      .accounts({
        payer: alice.publicKey,
        feeVault,
        fromToken: aliceTokenKp.publicKey,
        vaultTokenAccount: vaultTokenKp.publicKey,
        tokenMint: mintKp.publicKey,
        incoTokenProgram: CONFIDENTIAL_TOKEN_2022_PROGRAM_ID,
        incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }as any)
      .signers([alice])
      .rpc();

      console.log("Transaction signature:", tx);

    const vault = await program.account.feeVault.fetch(feeVault);
    expect(vault.totalFeesHandle.toString()).to.not.equal("0");
  });


  it("Authority distributes encrypted payout to Bob", async () => {
    const encryptedRequested = await encryptValue(
      30n * 10n ** BigInt(DECIMALS)
    );

    await program.methods
      .distribute(hexToBuffer(encryptedRequested), DECIMALS)
      .accounts({
        authority: authority.publicKey,
        feeVault,
        vaultTokenAccount: vaultTokenKp.publicKey,
        recipientTokenAccount: bobTokenKp.publicKey,
        tokenMint: mintKp.publicKey,
        incoTokenProgram: CONFIDENTIAL_TOKEN_2022_PROGRAM_ID,
        incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }as any)
      .rpc();

    const vault = await program.account.feeVault.fetch(feeVault);
    expect(vault.pendingDistributionHandle.toString()).to.not.equal("0");
  });


  it("Grant Bob decryption permission", async () => {
    const vault = await program.account.feeVault.fetch(feeVault);
    const handle = BigInt(vault.pendingDistributionHandle.toString());

    const handleBuf = Buffer.alloc(16);
    let h = handle;
    for (let i = 0; i < 16; i++) {
      handleBuf[i] = Number(h & 0xffn);
      h >>= 8n;
    }

    const [allowancePda] = PublicKey.findProgramAddressSync(
      [handleBuf, bob.publicKey.toBuffer()],
      INCO_LIGHTNING_PROGRAM_ID
    );

    await program.methods
      .grantDecryptAccess(new anchor.BN(handle))
      .accounts({
        authority: authority.publicKey,
        allowanceAccount: allowancePda,
        allowedAddress: bob.publicKey,
        incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }as any)
      .rpc();
  });


  it.skip("Bob decrypts payout correctly", async () => {
    const vault = await program.account.feeVault.fetch(feeVault);
    const handle = BigInt(vault.pendingDistributionHandle.toString());

    const result = await decrypt(
  [handle],
  {
    wallet: {
      publicKey: bob.publicKey,
      signTransaction: async (tx) => {
        tx.partialSign(bob);
        return tx;
      },
      signAllTransactions: async (txs) => {
        txs.forEach(tx => tx.partialSign(bob));
        return txs;
      },
    },
    connection,
  }
);

    const plaintext = BigInt(result.plaintexts[0]);

    expect(plaintext).to.equal(30n * 10n ** BigInt(DECIMALS));
    console.log("Bob decrypted payout:", plaintext.toString());
  });

  it("Settle epoch", async () => {
    await program.methods
      .settleEpoch()
      .accounts({
        authority: authority.publicKey,
        feeVault,
      }as any)
      .rpc();

    const vault = await program.account.feeVault.fetch(feeVault);
    expect(vault.isClosed).to.equal(true);
  });
});
