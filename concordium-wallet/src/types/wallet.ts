export type Network = 'Testnet' | 'Mainnet';

export interface CCDAccountKeyPair {
  publicKey: string;
  signingKey: string;
}

export interface WalletAccount {
  address: string;
  publicKey: string;
  signingKey: string;
  accountIndex: number;
  network: Network;
  balance?: string;
}

export interface WalletState {
  isInitialized: boolean;
  isLocked: boolean;
  accounts: WalletAccount[];
  activeAccountIndex: number;
  network: Network;
  seedPhrase?: string; // Only kept in memory, never persisted
  accountIndexCounter: number;
}

export interface StoredWalletData {
  encryptedSeed: string;
  accounts: Array<{
    address: string;
    publicKey: string;
    accountIndex: number;
    network: Network;
  }>;
  accountIndexCounter: number;
  network: Network;
}

export interface TransactionResult {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

// Token types
export interface TokenBalance {
  tokenId: string;
  contractIndex: number;
  contractSubindex: number;
  balance: string;
  metadata?: TokenMetadata;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  thumbnail?: string;
  icon?: string;
}

// Transaction history
export interface Transaction {
  id: number;
  hash: string;
  blockHash: string;
  blockTime: number;
  type: string;
  typeContents: string;
  cost: string;
  result: 'success' | 'rejected';
  sender?: string;
  amount?: string;
  destination?: string;
  details: Record<string, unknown>;
  tokenTransfer?: {
    tokenId: string;
    amount: string;
    from: string;
    to: string;
    contractIndex: number;
    contractSubindex: number;
  };
}

export interface AccountBalanceInfo {
  finalizedBalance: string;
  currentBalance: string;
  tokens: TokenBalance[];
}

// dApp signing
export interface DAppSession {
  topic: string;
  peerName: string;
  peerIcon?: string;
  peerUrl?: string;
  connectedAt: number;
}

export interface SignRequest {
  id: number;
  topic: string;
  method: string;
  params: unknown;
  peerName: string;
  peerIcon?: string;
}
