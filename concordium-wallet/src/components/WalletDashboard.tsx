import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { SendCCD } from './SendCCD';
import { CreateAccount } from './CreateAccount';
import { ConnectIDApp } from './ConnectIDApp';
import { TransactionHistory } from './TransactionHistory';
import { TokenList } from './TokenList';
import { DAppConnector } from './DAppConnector';
import { generateAccountFromSeed } from '../services/concordium';
import { getSession } from '../services/walletConnect';
import type { WalletAccount, TokenBalance } from '../types';

interface WalletDashboardProps {
  onLock: () => void;
  onReset: () => void;
}

type Tab = 'overview' | 'tokens' | 'history' | 'dapps';
type View = 'main' | 'send' | 'connect' | 'create';

export function WalletDashboard({ onLock, onReset }: WalletDashboardProps) {
  const { state, addAccount, refreshBalances, refreshTokens, fetchTransactions, setActiveAccount, persistState } = useWallet();
  const [view, setView] = useState<View>('main');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [password, setPassword] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sendToken, setSendToken] = useState<TokenBalance | null>(null);

  const activeAccount = state.accounts[state.activeAccountIndex];

  useEffect(() => {
    if (state.accounts.length > 0) {
      handleRefresh();
    }
  }, [state.accounts.length]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshBalances(),
        refreshTokens(),
        fetchTransactions(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateAccount = () => {
    const session = getSession();
    if (!session) {
      setView('connect');
    } else {
      setView('create');
    }
  };

  const handleAccountCreated = async (account: WalletAccount) => {
    addAccount(account);
    if (password) {
      await persistState(password);
    }
    setView('main');
    handleRefresh();
  };

  const handleConnected = () => {
    setView('create');
  };

  const handleSendToken = (token: TokenBalance) => {
    setSendToken(token);
    setView('send');
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Sub-views
  if (view === 'send' && activeAccount) {
    return (
      <SendCCD
        onClose={() => { setView('main'); setSendToken(null); }}
        onSuccess={handleRefresh}
        initialToken={sendToken}
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
    <div className={`wallet-dashboard ${isFullscreen ? 'fullscreen' : ''}`}>
      <header className="dashboard-header">
        <div className="logo-section">
          <h1>Concordium Wallet</h1>
          <span className="network-badge">{state.network}</span>
        </div>
        <div className="header-actions">
          <button onClick={toggleFullscreen} className="icon-button" title="Toggle fullscreen">
            {isFullscreen ? '\u2716' : '\u26F6'}
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="icon-button" title="Settings">
            &#9881;
          </button>
          <button onClick={onLock} className="icon-button" title="Lock wallet">
            &#128274;
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
            {/* Account Selector */}
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

            {/* Tab Navigation */}
            <nav className="tab-nav">
              {([
                { id: 'overview', label: 'Overview' },
                { id: 'tokens', label: 'Tokens' },
                { id: 'history', label: 'History' },
                { id: 'dapps', label: 'dApps' },
              ] as { id: Tab; label: string }[]).map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'overview' && activeAccount && (
                <div className="overview-tab">
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
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
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
                        Send
                      </button>
                      <button
                        onClick={() => copyToClipboard(activeAccount.address)}
                        className="secondary-button"
                      >
                        Receive
                      </button>
                      <a
                        href={`https://testnet.ccdscan.io/accounts/${activeAccount.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="secondary-button"
                      >
                        Explorer
                      </a>
                    </div>
                  </div>

                  {/* Quick token overview */}
                  <TokenList onSendToken={handleSendToken} />

                  {/* Account Details */}
                  <div className="account-details">
                    <h3>Account Details</h3>
                    <div className="detail-item">
                      <label>Public Key</label>
                      <code>{activeAccount.publicKey.slice(0, 30)}...</code>
                      <button
                        onClick={() => copyToClipboard(activeAccount.publicKey)}
                        className="copy-button"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="detail-item">
                      <label>Account Index</label>
                      <span>{activeAccount.accountIndex}</span>
                    </div>
                    <div className="detail-item">
                      <label>Network</label>
                      <span>{activeAccount.network}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tokens' && (
                <TokenList onSendToken={handleSendToken} />
              )}

              {activeTab === 'history' && (
                <TransactionHistory onClose={() => setActiveTab('overview')} />
              )}

              {activeTab === 'dapps' && (
                <DAppConnector onClose={() => setActiveTab('overview')} />
              )}
            </div>
          </>
        )}
      </main>

      <footer className="dashboard-footer">
        <p>Concordium Web Wallet - {state.network}</p>
      </footer>
    </div>
  );
}
