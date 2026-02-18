# Concordium Web Wallet

A feature-rich web wallet for the Concordium blockchain. Create accounts via the Concordium ID App, manage CCD and CIS-2 tokens, view transaction history, and connect to dApps — all from your browser.

## Features

- **Seed Phrase Management** — Generate or import 12/24-word BIP39 seed phrases
- **Multi-Account Support** — Derive multiple accounts from a single seed (SLIP-0010 path `m/44'/919'/0'/0'/n'`)
- **Account Creation via ID App** — WalletConnect v2 integration with the Concordium ID App for identity-verified account creation
- **CCD Transfers** — Send CCD with address validation, balance checks, and on-chain confirmation
- **CIS-2 Token Support** — Automatic token discovery, balance display, and token transfers
- **Transaction History** — Filterable history (sent, received, contract updates) with expandable details
- **dApp Connectivity** — Connect to Concordium dApps via WalletConnect v2, sign messages, and approve transactions
- **Real-Time Pricing** — CCD/USD conversion via CoinGecko
- **Secure Storage** — AES-256-GCM encryption with per-wallet random PBKDF2 salt, brute-force protection on unlock

## Prerequisites

- **Node.js** >= 18
- **Concordium ID App** — [App Store](https://apps.apple.com/app/concordium-id/id1566996491) | [Google Play](https://play.google.com/store/apps/details?id=com.concordium.id)
- **WalletConnect Project ID** — Get one from [WalletConnect Cloud](https://cloud.walletconnect.com/)

## Quick Start

```bash
# Clone and enter the project
git clone https://github.com/bogacyigitbasi/id-app-wallet.git
cd id-app-wallet/concordium-wallet

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your WalletConnect Project ID

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud Project ID | Yes |

Create a `.env` file in the `concordium-wallet/` directory:

```
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

## Usage

### Import or Create a Wallet

1. Choose **Create New Wallet** (generates a 24-word seed phrase) or **Import Wallet** (enter existing 12/24-word phrase)
2. Set a password (min 8 characters) to encrypt the wallet locally
3. The wallet opens in locked state on subsequent visits — enter your password to unlock

### Create an Account

1. Click **Create Account** on the dashboard
2. Scan the QR code with the Concordium ID App
3. Complete identity verification in the ID App
4. The wallet signs and submits the credential deployment transaction (gasless)
5. The account appears in the dashboard once confirmed on-chain

### Send CCD or Tokens

1. Click **Send** on the dashboard or click a token's send button
2. Select the asset (CCD or any discovered CIS-2 token)
3. Enter the recipient address and amount
4. Review the confirmation screen and submit
5. Transaction hash and explorer link are shown on success

### Connect a dApp

1. Navigate to the **dApps** tab
2. Click **Connect New dApp** and share the QR code with the dApp
3. Incoming sign requests appear as a modal with parsed transaction details
4. Approve or reject each request

## Architecture

```
src/
├── components/              # React UI components
│   ├── WalletDashboard.tsx    # Main interface with tabbed navigation
│   ├── TokenList.tsx          # CCD + CIS-2 token balances
│   ├── TransactionHistory.tsx # Filterable transaction history
│   ├── DAppConnector.tsx      # WalletConnect dApp management
│   ├── SignRequestModal.tsx   # dApp signing request approval
│   ├── SendCCD.tsx            # CCD and token transfer form
│   ├── CreateAccount.tsx      # ID App account creation flow
│   ├── ConnectIDApp.tsx       # WalletConnect QR pairing
│   ├── SeedPhraseInput.tsx    # Seed phrase import/creation
│   └── UnlockWallet.tsx       # Password unlock with rate limiting
├── contexts/
│   └── WalletContext.tsx      # Global state (useReducer + Context)
├── services/
│   ├── concordium.ts          # gRPC client, key derivation, transfers
│   ├── walletConnect.ts       # WalletConnect v2 SignClient
│   ├── tokenService.ts        # CIS-2 token discovery and transfers
│   ├── walletProxy.ts         # Wallet Proxy REST API
│   └── priceService.ts        # CCD/USD price (CoinGecko)
├── types/
│   └── wallet.ts              # TypeScript interfaces
├── utils/
│   ├── crypto.ts              # AES-256-GCM + PBKDF2 encryption
│   └── storage.ts             # localStorage persistence
└── App.tsx                    # Root component and view routing
```

### Data Flow

```
User → Components → WalletContext (state) → Services → External APIs
                                          ↓
                                        Utils (crypto, storage)

External APIs:
  • Concordium gRPC    — balance, transactions, contract invocations
  • Wallet Proxy       — transaction history, token metadata, PLT tokens
  • WalletConnect      — ID App pairing, dApp sessions
  • CoinGecko          — CCD price data
```

### Token Discovery Pipeline

Tokens are discovered from three sources, then deduplicated:

1. **Wallet Proxy v2 Balance** — tokens reported in account balance response
2. **PLT Tokens Endpoint** — known protocol-level tokens
3. **Transaction Events** — CIS-2 transfer events parsed from transaction history

Balances are fetched via gRPC `invokeContract` calling CIS-2 `balanceOf`.

## Security

| Layer | Protection |
|-------|-----------|
| **Seed Phrase** | Encrypted with AES-256-GCM; PBKDF2 (100k iterations, random 16-byte salt per wallet); decrypted only in memory while unlocked |
| **Private Keys** | Derived on-demand from seed phrase; never persisted to disk; wiped from memory on lock |
| **Wallet Unlock** | Brute-force protection with exponential backoff (5 attempts → 30s lockout, doubling) |
| **Password** | Stored only in a React ref (cleared on page refresh); never written to sessionStorage or localStorage |
| **dApp Signing** | Parsed transaction details shown to user; sender address validation; no auto-signing |
| **Secrets** | WalletConnect Project ID in `.env` (gitignored); no hardcoded secrets in source |
| **Debug Logging** | All sensitive logging removed from production code |

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 19.x | UI framework |
| Vite | 7.x | Build tool |
| TypeScript | 5.x (strict) | Type safety |
| @concordium/web-sdk | 12.x | Blockchain interaction |
| @concordium/id-app-sdk | 0.1.x | ID App integration |
| @walletconnect/sign-client | 2.x | WalletConnect v2 |
| qrcode.react | 4.x | QR code rendering |
| @scure/bip39 | — | Seed phrase generation |

## Scripts

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint static analysis
npm run preview   # Preview production build locally
```

## Technical Notes

- **Account Index** — Incremented after each account creation request, regardless of success or failure (required by the Concordium protocol)
- **Credential Deployment** — Gasless transaction; no CCD balance needed to create an account
- **WalletConnect Namespace** — Uses `concordium` namespace with Testnet and Mainnet chains
- **Backward Compatibility** — Wallets encrypted with the older static PBKDF2 salt are automatically decrypted and re-encrypted with a random salt on next save

## Network Support

Currently configured for **Concordium Testnet**. Mainnet endpoints are defined but not yet enabled for production use.

| Service | Testnet | Mainnet |
|---------|---------|---------|
| gRPC | `grpc.testnet.concordium.com:20000` | `grpc.mainnet.concordium.software:20000` |
| Wallet Proxy | `wallet-proxy.testnet.concordium.com` | `wallet-proxy.mainnet.concordium.software` |

## License

MIT
