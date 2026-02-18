import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import type { WalletState, WalletAccount, Network, StoredWalletData, TokenBalance, Transaction } from '../types';
import { saveWalletData, loadWalletData, clearWalletData } from '../utils/storage';
import { encryptData, decryptData } from '../utils/crypto';
import {
  generateAccountFromSeed,
  getAccountBalance,
  formatCCD,
} from '../services/concordium';
import { getTokenBalances, extractTokenTransferFromEvents } from '../services/tokenService';
import { getTransactionHistory, type WalletProxyTransaction } from '../services/walletProxy';

type WalletAction =
  | { type: 'INITIALIZE'; payload: { accounts: WalletAccount[]; network: Network; accountIndexCounter: number } }
  | { type: 'SET_SEED_PHRASE'; payload: string }
  | { type: 'ADD_ACCOUNT'; payload: WalletAccount }
  | { type: 'UPDATE_ACCOUNT_BALANCE'; payload: { index: number; balance: string } }
  | { type: 'SET_ACTIVE_ACCOUNT'; payload: number }
  | { type: 'SET_NETWORK'; payload: Network }
  | { type: 'SET_LOCKED'; payload: boolean }
  | { type: 'INCREMENT_ACCOUNT_INDEX' }
  | { type: 'SET_TOKENS'; payload: { address: string; tokens: TokenBalance[] } }
  | { type: 'SET_TRANSACTIONS'; payload: { address: string; transactions: Transaction[] } }
  | { type: 'RESET' };

interface ExtendedWalletState extends WalletState {
  tokenBalances: Record<string, TokenBalance[]>;
  transactions: Record<string, Transaction[]>;
}

const initialState: ExtendedWalletState = {
  isInitialized: false,
  isLocked: true,
  accounts: [],
  activeAccountIndex: 0,
  network: 'Testnet',
  seedPhrase: undefined,
  accountIndexCounter: 0,
  tokenBalances: {},
  transactions: {},
};

function walletReducer(state: ExtendedWalletState, action: WalletAction): ExtendedWalletState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        isInitialized: true,
        isLocked: false,
        accounts: action.payload.accounts,
        network: action.payload.network,
        accountIndexCounter: action.payload.accountIndexCounter,
      };
    case 'SET_SEED_PHRASE':
      return { ...state, seedPhrase: action.payload };
    case 'ADD_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts, action.payload],
        activeAccountIndex: state.accounts.length,
      };
    case 'UPDATE_ACCOUNT_BALANCE':
      return {
        ...state,
        accounts: state.accounts.map((acc, idx) =>
          idx === action.payload.index
            ? { ...acc, balance: action.payload.balance }
            : acc
        ),
      };
    case 'SET_ACTIVE_ACCOUNT':
      return { ...state, activeAccountIndex: action.payload };
    case 'SET_NETWORK':
      return { ...state, network: action.payload };
    case 'SET_LOCKED':
      return {
        ...state,
        isLocked: action.payload,
        seedPhrase: action.payload ? undefined : state.seedPhrase,
        // Wipe signing keys from all accounts when locking
        accounts: action.payload
          ? state.accounts.map((acc) => ({ ...acc, signingKey: '' }))
          : state.accounts,
        // Clear sensitive cached data
        tokenBalances: action.payload ? {} : state.tokenBalances,
        transactions: action.payload ? {} : state.transactions,
      };
    case 'INCREMENT_ACCOUNT_INDEX':
      return { ...state, accountIndexCounter: state.accountIndexCounter + 1 };
    case 'SET_TOKENS':
      return {
        ...state,
        tokenBalances: {
          ...state.tokenBalances,
          [action.payload.address]: action.payload.tokens,
        },
      };
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          [action.payload.address]: action.payload.transactions,
        },
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function mapProxyTransaction(tx: WalletProxyTransaction): Transaction {
  // Check both result.outcome and details.outcome for robustness
  const outcomeStr = (
    tx.result?.outcome || tx.details?.outcome || ''
  ).toString().toLowerCase();
  const isSuccess = outcomeStr === 'success';

  // Use transferAmount (clean, positive) when available, fall back to subtotal/total (strip sign)
  const rawAmount = tx.details?.transferAmount;
  const fallbackAmount = tx.subtotal || tx.total;
  const amount = rawAmount || (fallbackAmount ? fallbackAmount.replace(/^-/, '') : undefined);

  // Parse CIS-2 token transfer events for contract updates
  let tokenTransfer: Transaction['tokenTransfer'];
  if (tx.details?.events && Array.isArray(tx.details.events)) {
    tokenTransfer = extractTokenTransferFromEvents(tx.details.events as unknown[]);
  }

  return {
    id: tx.id,
    hash: tx.transactionHash,
    blockHash: tx.blockHash,
    blockTime: tx.blockTime,
    type: tx.details?.type || tx.type?.type || 'unknown',
    typeContents: tx.type?.contents || '',
    cost: tx.cost || '0',
    result: isSuccess ? 'success' : 'rejected',
    sender: tx.sender || tx.details?.transferSource,
    amount,
    destination: tx.details?.transferDestination,
    details: tx.details as Record<string, unknown>,
    tokenTransfer,
  };
}

interface WalletContextType {
  state: ExtendedWalletState;
  createWallet: (seedPhrase: string, password: string) => Promise<void>;
  unlockWallet: (password: string) => Promise<void>;
  lockWallet: () => void;
  addAccount: (account: WalletAccount) => void;
  refreshBalances: () => Promise<void>;
  refreshTokens: (transactions?: Transaction[]) => Promise<void>;
  fetchTransactions: (address?: string) => Promise<Transaction[]>;
  setActiveAccount: (index: number) => void;
  getNextAccountIndex: () => number;
  incrementAccountIndex: () => void;
  resetWallet: () => void;
  persistState: (password: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const sessionPasswordRef = useRef<string | null>(null);

  // On mount: show lock screen (password is never persisted)
  useEffect(() => {
    const stored = loadWalletData();
    if (!stored) return;

    dispatch({
      type: 'INITIALIZE',
      payload: {
        accounts: stored.accounts.map((acc) => ({
          ...acc,
          signingKey: '',
          balance: undefined,
        })),
        network: stored.network,
        accountIndexCounter: stored.accountIndexCounter,
      },
    });
    dispatch({ type: 'SET_LOCKED', payload: true });
  }, []);

  // Auto-persist whenever accounts or accountIndexCounter change
  const autoPersist = useCallback(async (currentState: ExtendedWalletState) => {
    if (!sessionPasswordRef.current || !currentState.seedPhrase) return;
    try {
      const encryptedSeed = await encryptData(currentState.seedPhrase, sessionPasswordRef.current);
      const walletData: StoredWalletData = {
        encryptedSeed,
        accounts: currentState.accounts.map((acc) => ({
          address: acc.address,
          publicKey: acc.publicKey,
          accountIndex: acc.accountIndex,
          network: acc.network,
        })),
        accountIndexCounter: currentState.accountIndexCounter,
        network: currentState.network,
      };
      saveWalletData(walletData);
    } catch {
      // Auto-persist failed silently
    }
  }, []);

  // Watch for account/index changes and auto-save
  useEffect(() => {
    if (state.isInitialized && !state.isLocked && sessionPasswordRef.current) {
      autoPersist(state);
    }
  }, [state.accounts.length, state.accountIndexCounter, state.isLocked]);

  const createWallet = async (seedPhrase: string, password: string) => {
    generateAccountFromSeed(seedPhrase, state.network, 0);

    sessionPasswordRef.current = password;
    dispatch({ type: 'SET_SEED_PHRASE', payload: seedPhrase });

    const encryptedSeed = await encryptData(seedPhrase, password);
    const walletData: StoredWalletData = {
      encryptedSeed,
      accounts: [],
      accountIndexCounter: 0,
      network: state.network,
    };
    saveWalletData(walletData);

    dispatch({
      type: 'INITIALIZE',
      payload: {
        accounts: [],
        network: state.network,
        accountIndexCounter: 0,
      },
    });
    dispatch({ type: 'SET_LOCKED', payload: false });
  };

  const unlockWallet = async (password: string) => {
    const stored = loadWalletData();
    if (!stored) {
      throw new Error('No wallet data found');
    }

    const seedPhrase = await decryptData(stored.encryptedSeed, password);
    dispatch({ type: 'SET_SEED_PHRASE', payload: seedPhrase });

    const accounts: WalletAccount[] = stored.accounts.map((acc) => {
      const keyPair = generateAccountFromSeed(seedPhrase, acc.network, acc.accountIndex);
      return {
        ...acc,
        signingKey: keyPair.signingKey,
      };
    });

    dispatch({
      type: 'INITIALIZE',
      payload: {
        accounts,
        network: stored.network,
        accountIndexCounter: stored.accountIndexCounter,
      },
    });
    sessionPasswordRef.current = password;
    dispatch({ type: 'SET_LOCKED', payload: false });
  };

  const lockWallet = () => {
    sessionPasswordRef.current = null;
    dispatch({ type: 'SET_LOCKED', payload: true });
  };

  const addAccount = (account: WalletAccount) => {
    dispatch({ type: 'ADD_ACCOUNT', payload: account });
  };

  const refreshBalances = async () => {
    for (let i = 0; i < state.accounts.length; i++) {
      const account = state.accounts[i];
      try {
        const balance = await getAccountBalance(account.address, state.network);
        dispatch({
          type: 'UPDATE_ACCOUNT_BALANCE',
          payload: { index: i, balance: formatCCD(balance) },
        });
      } catch (error) {
        console.error(`Failed to refresh balance for account ${i}:`, error);
      }
    }
  };

  const refreshTokens = async (txs?: Transaction[]) => {
    for (const account of state.accounts) {
      try {
        // Use provided transactions or fall back to existing state
        const transactions = txs || state.transactions[account.address] || [];
        const tokens = await getTokenBalances(account.address, state.network, transactions);
        dispatch({
          type: 'SET_TOKENS',
          payload: { address: account.address, tokens },
        });
      } catch (error) {
        console.error(`Failed to refresh tokens for ${account.address}:`, error);
      }
    }
  };

  const fetchTransactions = async (address?: string): Promise<Transaction[]> => {
    const targetAddress = address || state.accounts[state.activeAccountIndex]?.address;
    if (!targetAddress) return [];

    try {
      const response = await getTransactionHistory(targetAddress, state.network, 50);
      const transactions = response.transactions.map(mapProxyTransaction);
      dispatch({
        type: 'SET_TRANSACTIONS',
        payload: { address: targetAddress, transactions },
      });
      return transactions;
    } catch (error) {
      console.error(`Failed to fetch transactions for ${targetAddress}:`, error);
      return [];
    }
  };

  const setActiveAccount = (index: number) => {
    dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: index });
  };

  const getNextAccountIndex = () => {
    return state.accountIndexCounter;
  };

  const incrementAccountIndex = () => {
    dispatch({ type: 'INCREMENT_ACCOUNT_INDEX' });
  };

  const resetWallet = () => {
    clearWalletData();
    dispatch({ type: 'RESET' });
  };

  const persistState = async (password: string) => {
    if (!state.seedPhrase) {
      throw new Error('Wallet is locked');
    }

    const encryptedSeed = await encryptData(state.seedPhrase, password);
    const walletData: StoredWalletData = {
      encryptedSeed,
      accounts: state.accounts.map((acc) => ({
        address: acc.address,
        publicKey: acc.publicKey,
        accountIndex: acc.accountIndex,
        network: acc.network,
      })),
      accountIndexCounter: state.accountIndexCounter,
      network: state.network,
    };
    saveWalletData(walletData);
  };

  return (
    <WalletContext.Provider
      value={{
        state,
        createWallet,
        unlockWallet,
        lockWallet,
        addAccount,
        refreshBalances,
        refreshTokens,
        fetchTransactions,
        setActiveAccount,
        getNextAccountIndex,
        incrementAccountIndex,
        resetWallet,
        persistState,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
