import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import type { WalletState, WalletAccount, Network, StoredWalletData } from '../types';
import { saveWalletData, loadWalletData, clearWalletData } from '../utils/storage';
import { encryptData, decryptData } from '../utils/crypto';
import {
  generateAccountFromSeed,
  getAccountBalance,
  formatCCD,
} from '../services/concordium';

type WalletAction =
  | { type: 'INITIALIZE'; payload: { accounts: WalletAccount[]; network: Network; accountIndexCounter: number } }
  | { type: 'SET_SEED_PHRASE'; payload: string }
  | { type: 'ADD_ACCOUNT'; payload: WalletAccount }
  | { type: 'UPDATE_ACCOUNT_BALANCE'; payload: { index: number; balance: string } }
  | { type: 'SET_ACTIVE_ACCOUNT'; payload: number }
  | { type: 'SET_NETWORK'; payload: Network }
  | { type: 'SET_LOCKED'; payload: boolean }
  | { type: 'INCREMENT_ACCOUNT_INDEX' }
  | { type: 'RESET' };

const initialState: WalletState = {
  isInitialized: false,
  isLocked: true,
  accounts: [],
  activeAccountIndex: 0,
  network: 'Testnet',
  seedPhrase: undefined,
  accountIndexCounter: 0,
};

function walletReducer(state: WalletState, action: WalletAction): WalletState {
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
      };
    case 'INCREMENT_ACCOUNT_INDEX':
      return { ...state, accountIndexCounter: state.accountIndexCounter + 1 };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface WalletContextType {
  state: WalletState;
  createWallet: (seedPhrase: string, password: string) => Promise<void>;
  unlockWallet: (password: string) => Promise<void>;
  lockWallet: () => void;
  addAccount: (account: WalletAccount) => void;
  refreshBalances: () => Promise<void>;
  setActiveAccount: (index: number) => void;
  getNextAccountIndex: () => number;
  incrementAccountIndex: () => void;
  resetWallet: () => void;
  persistState: (password: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  // Check for existing wallet on mount
  useEffect(() => {
    const stored = loadWalletData();
    if (stored) {
      // Wallet exists but is locked
      dispatch({
        type: 'INITIALIZE',
        payload: {
          accounts: stored.accounts.map((acc) => ({
            ...acc,
            signingKey: '', // Will be restored on unlock
            balance: undefined,
          })),
          network: stored.network,
          accountIndexCounter: stored.accountIndexCounter,
        },
      });
      dispatch({ type: 'SET_LOCKED', payload: true });
    }
  }, []);

  const createWallet = async (seedPhrase: string, password: string) => {
    // Validate the seed phrase by trying to generate a key pair
    generateAccountFromSeed(seedPhrase, state.network, 0);

    dispatch({ type: 'SET_SEED_PHRASE', payload: seedPhrase });

    // Encrypt and store
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

    // Restore accounts with signing keys
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
    dispatch({ type: 'SET_LOCKED', payload: false });
  };

  const lockWallet = () => {
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
