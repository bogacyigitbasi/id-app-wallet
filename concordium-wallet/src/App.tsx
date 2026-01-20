import { useState } from 'react';
import { WalletProvider, useWallet } from './contexts/WalletContext';
import { SeedPhraseInput, UnlockWallet, WalletDashboard } from './components';
import { hasWalletData } from './utils/storage';
import './App.css';

type AppView = 'welcome' | 'import' | 'unlock' | 'dashboard';

function WalletApp() {
  const { state, createWallet, unlockWallet, resetWallet, lockWallet } = useWallet();
  const [view, setView] = useState<AppView>(() => {
    if (hasWalletData()) {
      return 'unlock';
    }
    return 'welcome';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImportWallet = async (seedPhrase: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      await createWallet(seedPhrase, password);
      setView('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async (password: string) => {
    await unlockWallet(password);
    setView('dashboard');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset your wallet? This will delete all data. You will need your seed phrase to recover your accounts.')) {
      resetWallet();
      setView('welcome');
    }
  };

  const handleLock = () => {
    lockWallet();
    setView('unlock');
  };

  // If wallet exists and is locked, show unlock screen
  if (view === 'unlock' || (state.isInitialized && state.isLocked)) {
    return (
      <UnlockWallet
        onUnlock={handleUnlock}
        onReset={handleReset}
      />
    );
  }

  // If wallet is unlocked, show dashboard
  if (state.isInitialized && !state.isLocked) {
    return (
      <WalletDashboard
        onLock={handleLock}
        onReset={handleReset}
      />
    );
  }

  // Welcome / Import flow
  if (view === 'welcome') {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <h1>Concordium Web Wallet</h1>
          <p className="subtitle">Testnet</p>

          <div className="welcome-description">
            <p>
              A simple web wallet for interacting with the Concordium blockchain.
              Create accounts, send CCD, and manage your identity.
            </p>
          </div>

          <div className="welcome-actions">
            <button onClick={() => setView('import')} className="primary-button">
              Import Wallet
            </button>
          </div>

          <div className="welcome-note">
            <p>
              <strong>Note:</strong> This wallet requires a seed phrase to derive keys.
              Your seed phrase is encrypted and stored locally.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'import') {
    return (
      <div className="import-screen">
        <button onClick={() => setView('welcome')} className="back-button">
          ← Back
        </button>
        <h1>Import Wallet</h1>
        <p>Enter your existing seed phrase to import your wallet.</p>

        {error && <div className="error-message">{error}</div>}

        <SeedPhraseInput
          onSubmit={handleImportWallet}
          isLoading={isLoading}
          mode="import"
        />
      </div>
    );
  }

  return null;
}

function App() {
  return (
    <WalletProvider>
      <div className="app">
        <WalletApp />
      </div>
    </WalletProvider>
  );
}

export default App;
