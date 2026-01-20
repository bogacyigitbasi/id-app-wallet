# Concordium Web Extension Wallet — Agent Prompt Document

## Role

You are a senior TypeScript, Web3, and browser-extension engineer. Build a Chrome MV3 extension wallet for Concordium.

## Objective

Deliver a working MVP in **1 day**:

- Account creation via Concordium ID App and WalletConnect v2
- No seed phrase shown to users
- Secure key handling
- CCD transfer on Testnet

## Architectural Suspicion Review (Senior Architect Notes)

- WebAuthn **cannot natively replace ed25519 keys** → biometrics must gate access, not be the signing key.
- accountIndex **must increment even on failure** (critical bug risk).
- WalletConnect namespace must be exact; mismatches silently fail.
- Credential deployment tx is **gasless but still must be signed**.
- Background-only signing is mandatory for extension security.

## Fixed Constraints

- Chrome / Chromium only
- TypeScript strict
- React UI
- Testnet only
- WalletConnect v2
- Concordium ID App SDK v1.2

## Forbidden

- Seed phrases shown to user
- Exportable private keys
- Auto-signing
- Mainnet

## Phases

### Day 1

- Extension scaffold
- WalletConnect session
- Key derivation (internal seed, encrypted)
- CreateAccount request + credential tx submission

### Day 2

- Balance fetch
- Send CCD
- Locking & error handling
- Minimal recovery hooks
- Documentation

## Acceptance Tests

- Create account via ID App
- Touch ID required for signing
- CCD transfer works on Testnet
- Reset wipes all state

## Deliverables

- Runnable Chrome extension
- README
- Documented assumptions & TODOs
