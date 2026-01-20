import { useState } from 'react';

interface UnlockWalletProps {
  onUnlock: (password: string) => Promise<void>;
  onReset: () => void;
}

export function UnlockWallet({ onUnlock, onReset }: UnlockWalletProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onUnlock(password);
    } catch (err) {
      setError('Invalid password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="unlock-wallet">
      <div className="logo">
        <h1>Concordium Wallet</h1>
        <p>Testnet</p>
      </div>

      <form onSubmit={handleSubmit} className="unlock-form">
        <div className="form-group">
          <label htmlFor="password">Enter Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your wallet password"
            disabled={isLoading}
            autoComplete="current-password"
            autoFocus
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={isLoading} className="primary-button">
          {isLoading ? 'Unlocking...' : 'Unlock Wallet'}
        </button>
      </form>

      <div className="reset-section">
        <p>Forgot password?</p>
        <button onClick={onReset} className="text-button danger">
          Reset Wallet
        </button>
        <p className="warning">
          Warning: Resetting will delete all wallet data. You will need your seed phrase to recover.
        </p>
      </div>
    </div>
  );
}
