# Concordium Web Wallet

A web-based wallet for the Concordium blockchain that integrates with the Concordium ID App for account creation via WalletConnect v2.

## Features

- **Seed Phrase Import**: Import your existing seed phrase to derive Concordium keys
- **WalletConnect Integration**: Connect to Concordium ID App via QR code
- **Account Creation**: Create new Concordium accounts through identity verification
- **Balance Display**: View your CCD balance on Testnet
- **Secure Storage**: Seed phrases are encrypted with AES-256-GCM and stored locally

## Prerequisites

1. **Concordium ID App**: Download from [App Store](https://apps.apple.com/app/concordium-id/id1566996491) or [Google Play](https://play.google.com/store/apps/details?id=com.concordium.id)
2. **WalletConnect Project ID**: Get one from [WalletConnect Cloud](https://cloud.walletconnect.com/)

## Setup

1. Clone the repository:
```bash
cd concordium-wallet
```

2. Install dependencies:
```bash
npm install
```

3. Update the WalletConnect Project ID in `src/services/walletConnect.ts`:
```typescript
const WALLETCONNECT_PROJECT_ID = 'YOUR_PROJECT_ID';
```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

## Usage

### Import Wallet

1. Click "Import Wallet" on the welcome screen
2. Enter your 12 or 24-word seed phrase
3. Create a password to encrypt your wallet locally
4. Click "Import Wallet"

### Create Account

1. After importing your wallet, click "Create Account"
2. A QR code will appear - scan it with the Concordium ID App
3. Complete identity verification in the ID App
4. The account will be created and displayed in the wallet

### Account Creation Flow

The account creation follows the Concordium IDApp SDK v1.2 integration:

1. **Key Derivation**: Keys are derived from your seed phrase using SLIP-0010 (path: `m/44'/919'/0'/0'/accountIndex'`)
2. **WalletConnect Session**: A session is established with the ID App
3. **Create Account Request**: Public key is sent to the ID App
4. **Identity Verification**: User completes KYC in the ID App
5. **Credential Deployment**: The wallet signs and submits the credential deployment transaction
6. **Account Activation**: Once confirmed on-chain, the account is ready to use

## Architecture

```
src/
├── components/          # React UI components
│   ├── ConnectIDApp.tsx    # WalletConnect QR code display
│   ├── CreateAccount.tsx   # Account creation flow
│   ├── SendCCD.tsx         # CCD transfer (placeholder)
│   ├── SeedPhraseInput.tsx # Seed phrase entry
│   ├── UnlockWallet.tsx    # Password unlock screen
│   └── WalletDashboard.tsx # Main wallet view
├── contexts/            # React contexts
│   └── WalletContext.tsx   # Global wallet state
├── services/            # External integrations
│   ├── concordium.ts       # Concordium SDK integration
│   └── walletConnect.ts    # WalletConnect v2 client
├── types/               # TypeScript types
│   └── wallet.ts           # Wallet-related types
├── utils/               # Utility functions
│   ├── crypto.ts           # Encryption/decryption
│   └── storage.ts          # Local storage helpers
└── App.tsx              # Main application component
```

## Security Considerations

- **Seed phrases are never shown to users** after initial import
- **Private keys remain in memory only** and are never persisted
- **Encryption uses Web Crypto API** with PBKDF2 key derivation
- **No auto-signing** - all transactions require explicit user action
- **Testnet only** - this MVP is not intended for mainnet use

## Technical Notes

- **Account Index**: Must be incremented after each account creation request, regardless of success/failure
- **Credential Deployment**: This is a gasless transaction - no CCD is required
- **WalletConnect Namespace**: Uses `concordium` namespace with `create_account` method

## Limitations (MVP)

- CCD transfer is not yet implemented (use ID App or browser wallet)
- Only supports Testnet
- No transaction history
- Single seed phrase per wallet instance

## Dependencies

- `@concordium/id-app-sdk` - Concordium ID App SDK for account creation
- `@concordium/web-sdk` - Concordium Web SDK for blockchain interaction
- `@walletconnect/sign-client` - WalletConnect v2 for ID App communication
- `qrcode.react` - QR code generation for WalletConnect URI
- `react` - UI framework
- `vite` - Build tool

## License

MIT
