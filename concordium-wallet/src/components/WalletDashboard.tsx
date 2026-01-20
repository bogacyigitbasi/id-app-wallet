import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { SendCCD } from './SendCCD';
import { CreateAccount } from './CreateAccount';
import { ConnectIDApp } from './ConnectIDApp';
import { generateAccountFromSeed } from '../services/concordium';
import { getSession } from '../services/walletConnect';
import type { WalletAccount } from '../types';

interface WalletDashboardProps {
  onLock: () => void;
  onReset: () => void;
}

type View = 'main' | 'send' | 'connect' | 'create';

export function WalletDashboard({ onLock, onReset }: WalletDashboardProps) {
  const { state, addAccount, refreshBalances, setActiveAccount, persistState } = useWallet();
  const [view, setView] = useState<View>('main');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [password, setPassword] = useState('');

  const activeAccount = state.accounts[state.activeAccountIndex];

  useEffect(() => {
    if (state.accounts.length > 0) {
      handleRefresh();
    }
  }, [state.accounts.length]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshBalances();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateAccount = () => {
    // Check if we have a WalletConnect session
    const session = getSession();
    if (!session) {
      setView('connect');
    } else {
      setView('create');
    }
  };

  const handleAccountCreated = async (account: WalletAccount) => {
    addAccount(account);
    // Persist the new account
    if (password) {
      await persistState(password);
    }
    setView('main');
    handleRefresh();
  };

  const handleConnected = () => {
    setView('create');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getCurrentPublicKey = () => {
    if (!state.seedPhrase) return '';
    const keyPair = generateAccountFromSeed(
      state.seedPhrase,
      state.network,
      state.accountIndexCounter
    );
    return keyPair.publicKey;
  };

  if (view === 'send' && activeAccount) {
    return (
      <SendCCD
        onClose={() => setView('main')}
        onSuccess={handleRefresh}
      />
    );
  }

  if (view === 'connect') {
    return (
      <ConnectIDApp
        network={state.network}
        onConnected={handleConnected}
        publicKey={getCurrentPublicKey()}
      />
    );
  }

  if (view === 'create') {
    return (
      <CreateAccount
        onAccountCreated={handleAccountCreated}
        onCancel={() => setView('main')}
      />
    );
  }

  return (
    <div className="wallet-dashboard">
      <header className="dashboard-header">
        <div className="logo-section">
          <h1>Concordium Wallet</h1>
          <span className="network-badge">{state.network}</span>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowSettings(!showSettings)} className="icon-button">
            ⚙️
          </button>
          <button onClick={onLock} className="icon-button">
            🔒
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="settings-panel">
          <h3>Settings</h3>
          <div className="setting-item">
            <label>Save Password (for this session)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to save changes"
            />
          </div>
          <button onClick={onReset} className="danger-button">
            Reset Wallet
          </button>
          <button onClick={() => setShowSettings(false)} className="secondary-button">
            Close
          </button>
        </div>
      )}

      <main className="dashboard-main">
        {state.accounts.length === 0 ? (
          <div className="no-accounts">
            <h2>Welcome!</h2>
            <p>You don't have any accounts yet. Create your first Concordium account to get started.</p>
            <button onClick={handleCreateAccount} className="primary-button">
              Create Account
            </button>
          </div>
        ) : (
          <>
            <div className="account-selector">
              <label>Account</label>
              <select
                value={state.activeAccountIndex}
                onChange={(e) => setActiveAccount(Number(e.target.value))}
              >
                {state.accounts.map((acc, idx) => (
                  <option key={acc.address} value={idx}>
                    Account {idx + 1} ({acc.address.slice(0, 8)}...)
                  </option>
                ))}
              </select>
              <button onClick={handleCreateAccount} className="add-account-button">
                + Add Account
              </button>
            </div>

            {activeAccount && (
              <div className="account-card">
                <div className="balance-section">
                  <span className="balance-label">Balance</span>
                  <span className="balance-value">
                    {activeAccount.balance ?? '...'} CCD
                  </span>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="refresh-button"
                  >
                    {isRefreshing ? '⟳' : '↻'} Refresh
                  </button>
                </div>

                <div className="address-section">
                  <label>Address</label>
                  <div className="address-display">
                    <code>{activeAccount.address}</code>
                    <button
                      onClick={() => copyToClipboard(activeAccount.address)}
                      className="copy-button"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="action-buttons">
                  <button onClick={() => setView('send')} className="primary-button">
                    Send CCD
                  </button>
                  <a
                    href={`https://testnet.ccdscan.io/accounts/${activeAccount.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="secondary-button"
                  >
                    View on Explorer
                  </a>
                </div>
              </div>
            )}

            <div className="account-details">
              <h3>Account Details</h3>
              <div className="detail-item">
                <label>Public Key</label>
                <code>{activeAccount?.publicKey.slice(0, 30)}...</code>
                <button
                  onClick={() => copyToClipboard(activeAccount?.publicKey || '')}
                  className="copy-button"
                >
                  Copy
                </button>
              </div>
              <div className="detail-item">
                <label>Account Index</label>
                <span>{activeAccount?.accountIndex}</span>
              </div>
              <div className="detail-item">
                <label>Network</label>
                <span>{activeAccount?.network}</span>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="dashboard-footer">
        <p>Concordium Web Wallet - Testnet Only</p>
      </footer>
    </div>
  );
}
