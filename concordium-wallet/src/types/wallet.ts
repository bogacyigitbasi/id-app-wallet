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
