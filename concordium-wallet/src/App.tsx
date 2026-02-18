import { useState } from 'react';
import { WalletProvider, useWallet } from './contexts/WalletContext';
import { SeedPhraseInput, UnlockWallet, WalletDashboard } from './components';
import { hasWalletData } from './utils/storage';
import { generateSeedPhrase } from './services/concordium';
import './App.css';

type AppView = 'welcome' | 'create' | 'import' | 'unlock' | 'dashboard';

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
  const [generatedSeed, setGeneratedSeed] = useState('');

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
            <button onClick={() => {
              setGeneratedSeed(generateSeedPhrase());
              setView('create');
            }} className="primary-button">
              Create New Wallet
            </button>
            <button onClick={() => setView('import')} className="secondary-button">
              Restore Existing Wallet
            </button>
          </div>

          <div className="welcome-note">
            <p>
              <strong>Note:</strong> Your seed phrase is encrypted and stored locally.
              Never share it with anyone.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <CreateWalletFlow
        seedPhrase={generatedSeed}
        onSubmit={handleImportWallet}
        onBack={() => setView('welcome')}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  if (view === 'import') {
    return (
      <div className="import-screen">
        <button onClick={() => setView('welcome')} className="back-button">
          ← Back
        </button>
        <h1>Restore Wallet</h1>
        <p>Enter your existing seed phrase to restore your wallet.</p>

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

interface CreateWalletFlowProps {
  seedPhrase: string;
  onSubmit: (seedPhrase: string, password: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string;
}

function CreateWalletFlow({ seedPhrase, onSubmit, onBack, isLoading, error }: CreateWalletFlowProps) {
  const [step, setStep] = useState<'backup' | 'password'>('backup');
  const [backedUp, setBackedUp] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const words = seedPhrase.split(' ');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(seedPhrase);
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    onSubmit(seedPhrase, password);
  };

  if (step === 'backup') {
    return (
      <div className="create-wallet-screen">
        <button onClick={onBack} className="back-button">← Back</button>
        <h1>Back Up Your Seed Phrase</h1>
        <p className="warning-text">
          Write down these 24 words in order and store them somewhere safe.
          This is the only way to recover your wallet.
        </p>

        <div className="seed-phrase-grid">
          {words.map((word, idx) => (
            <div key={idx} className="seed-word">
              <span className="seed-word-number">{idx + 1}</span>
              <span className="seed-word-text">{word}</span>
            </div>
          ))}
        </div>

        <button onClick={copyToClipboard} className="secondary-button" style={{ marginTop: '1rem' }}>
          Copy to Clipboard
        </button>

        <label className="backup-checkbox">
          <input
            type="checkbox"
            checked={backedUp}
            onChange={(e) => setBackedUp(e.target.checked)}
          />
          I have written down my seed phrase and stored it safely
        </label>

        <button
          onClick={() => setStep('password')}
          disabled={!backedUp}
          className="primary-button"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="create-wallet-screen">
      <button onClick={() => setStep('backup')} className="back-button">← Back</button>
      <h1>Set a Password</h1>
      <p>This password encrypts your seed phrase locally.</p>

      <form onSubmit={handleSetPassword} className="seed-phrase-form">
        <div className="form-group">
          <label htmlFor="create-password">Password</label>
          <input
            type="password"
            id="create-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="create-confirm-password">Confirm Password</label>
          <input
            type="password"
            id="create-confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>

        {(formError || error) && <div className="error-message">{formError || error}</div>}

        <button type="submit" disabled={isLoading} className="primary-button">
          {isLoading ? 'Creating Wallet...' : 'Create Wallet'}
        </button>
      </form>
    </div>
  );
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
