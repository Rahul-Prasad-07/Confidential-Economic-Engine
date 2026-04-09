import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";
import { createHash } from "crypto";
import BN from "bn.js";

describe("MagicBlock Privacy Desk - program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program: any = anchor.workspace.ConfidentialEconomicEngine;

  const authority = provider.wallet as anchor.Wallet;
  const agent = authority.payer;

  let deskConfig: PublicKey;
  let intentSessionOne: PublicKey;
  let intentSessionTwo: PublicKey;

  const sessionBase = Math.floor(Date.now() / 1000);
  const SESSION_ID_ONE = new BN(sessionBase * 10 + 1);
  const SESSION_ID_TWO = new BN(sessionBase * 10 + 2);

  const commitment = (value: string) =>
    Array.from(createHash("sha256").update(value).digest()) as number[];

  before(async () => {
    [deskConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("desk_config"), authority.publicKey.toBuffer()],
      program.programId
    );

    [intentSessionOne] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("intent_session"),
        deskConfig.toBuffer(),
        SESSION_ID_ONE.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    [intentSessionTwo] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("intent_session"),
        deskConfig.toBuffer(),
        SESSION_ID_TWO.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

  });

  it("initializes desk policy", async () => {
    try {
      await program.methods
        .initializeDesk(new BN(1_000_000), 250, new BN(5_000_000))
        .accounts({
          authority: authority.publicKey,
          deskConfig,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch {
      await program.methods
        .updatePolicy(new BN(1_000_000), 250, new BN(5_000_000))
        .accounts({
          authority: authority.publicKey,
          deskConfig,
        })
        .rpc();
    }

    const desk = await program.account.deskConfig.fetch(deskConfig);
    expect(desk.authority.toBase58()).to.equal(authority.publicKey.toBase58());
    expect(desk.maxNotionalPerExecution.toNumber()).to.equal(1_000_000);
    expect(desk.maxSlippageBps).to.equal(250);
    expect(desk.dailyNotionalCap.toNumber()).to.equal(5_000_000);
    expect(desk.halted).to.equal(false);
  });

  it("opens private intent and submits private quote", async () => {
    await program.methods
      .openPrivateIntent(
        SESSION_ID_ONE,
        commitment("intent:buy:SOL:confidential"),
        new BN(800_000),
        180
      )
      .accounts({
        agent: agent.publicKey,
        payer: authority.publicKey,
        deskConfig,
        intentSession: intentSessionOne,
        systemProgram: SystemProgram.programId,
      })
      .signers([agent])
      .rpc();

    await program.methods
      .submitPrivateQuote(SESSION_ID_ONE, commitment("quote:makerA:priceband"))
      .accounts({
        authority: authority.publicKey,
        desk: deskConfig,
        intentSession: intentSessionOne,
      })
      .rpc();

    const session = await program.account.intentSession.fetch(intentSessionOne);
    expect(session.status).to.equal(2);
    expect(session.requestedNotionalCap.toNumber()).to.equal(800_000);
    expect(session.requestedSlippageBps).to.equal(180);
  });

  it("settles private execution under policy", async () => {
    const beforeDesk = await program.account.deskConfig.fetch(deskConfig);
    const beforeConsumed = beforeDesk.consumedToday.toNumber();
    const beforeSettlementId = beforeDesk.lastSettlementId.toNumber();

    await program.methods
      .settlePrivateExecution(
        SESSION_ID_ONE,
        new BN(700_000),
        120,
        commitment("settlement:tx-ref-001")
      )
      .accounts({
        authority: authority.publicKey,
        desk: deskConfig,
        intentSession: intentSessionOne,
      })
      .rpc();

    const desk = await program.account.deskConfig.fetch(deskConfig);
    const session = await program.account.intentSession.fetch(intentSessionOne);

    expect(session.status).to.equal(3);
    expect(session.settlementAmount.toNumber()).to.equal(700_000);
    expect(session.realizedSlippageBps).to.equal(120);
    expect(desk.consumedToday.toNumber() - beforeConsumed).to.equal(700_000);
    expect(desk.lastSettlementId.toNumber()).to.equal(beforeSettlementId + 1);
  });

  it("blocks settlement above session cap", async () => {
    await program.methods
      .openPrivateIntent(
        SESSION_ID_TWO,
        commitment("intent:sell:ETH:confidential"),
        new BN(200_000),
        150
      )
      .accounts({
        agent: agent.publicKey,
        payer: authority.publicKey,
        deskConfig,
        intentSession: intentSessionTwo,
        systemProgram: SystemProgram.programId,
      })
      .signers([agent])
      .rpc();

    await program.methods
      .submitPrivateQuote(SESSION_ID_TWO, commitment("quote:makerB:tight"))
      .accounts({
        authority: authority.publicKey,
        desk: deskConfig,
        intentSession: intentSessionTwo,
      })
      .rpc();

    try {
      await program.methods
        .settlePrivateExecution(
          SESSION_ID_TWO,
          new BN(300_000),
          120,
          commitment("settlement:tx-ref-002")
        )
        .accounts({
          authority: authority.publicKey,
          desk: deskConfig,
          intentSession: intentSessionTwo,
        })
        .rpc();
      expect.fail("expected policy failure");
    } catch (error) {
      expect(String(error)).to.include("SettlementAboveSessionCap");
    }
  });

  it("can halt desk and reject new intents", async () => {
    await program.methods
      .setHalt(true)
      .accounts({
        authority: authority.publicKey,
        deskConfig,
      })
      .rpc();

    const sessionId = new BN(sessionBase * 10 + 3);
    const [intentSessionThree] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("intent_session"),
        deskConfig.toBuffer(),
        sessionId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    try {
      await program.methods
        .openPrivateIntent(
          sessionId,
          commitment("intent:halt-check"),
          new BN(100_000),
          100
        )
        .accounts({
          agent: agent.publicKey,
          payer: authority.publicKey,
          deskConfig,
          intentSession: intentSessionThree,
          systemProgram: SystemProgram.programId,
        })
        .signers([agent])
        .rpc();
      expect.fail("expected halted desk rejection");
    } catch (error) {
      expect(String(error)).to.include("DeskHalted");
    }

    await program.methods
      .setHalt(false)
      .accounts({
        authority: authority.publicKey,
        deskConfig,
      })
      .rpc();
  });
});
