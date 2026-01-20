import { useState } from 'react';

interface SeedPhraseInputProps {
  onSubmit: (seedPhrase: string, password: string) => void;
  isLoading?: boolean;
  mode: 'create' | 'import';
}

export function SeedPhraseInput({ onSubmit, isLoading, mode }: SeedPhraseInputProps) {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate seed phrase (basic validation)
    const words = seedPhrase.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      setError('Seed phrase must be 12 or 24 words');
      return;
    }

    // Validate password
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    onSubmit(seedPhrase.trim().toLowerCase(), password);
  };

  return (
    <form onSubmit={handleSubmit} className="seed-phrase-form">
      <div className="form-group">
        <label htmlFor="seedPhrase">
          {mode === 'create' ? 'Enter your seed phrase' : 'Import seed phrase'}
        </label>
        <textarea
          id="seedPhrase"
          value={seedPhrase}
          onChange={(e) => setSeedPhrase(e.target.value)}
          placeholder="Enter your 12 or 24 word seed phrase..."
          rows={4}
          disabled={isLoading}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="hint">
          Your seed phrase will be encrypted and stored locally. Never share it with anyone.
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password to encrypt your wallet"
          disabled={isLoading}
          autoComplete="new-password"
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          disabled={isLoading}
          autoComplete="new-password"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" disabled={isLoading} className="primary-button">
        {isLoading ? 'Processing...' : mode === 'create' ? 'Create Wallet' : 'Import Wallet'}
      </button>
    </form>
  );
}
