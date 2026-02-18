import { useState, useEffect, useCallback } from 'react';

const LOCKOUT_KEY = 'concordium_unlock_lockout';
const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 30_000; // 30 seconds

interface LockoutState {
  attempts: number;
  lockedUntil: number; // epoch ms, 0 = not locked
}

function getLockoutState(): LockoutState {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (raw) return JSON.parse(raw) as LockoutState;
  } catch { /* ignore corrupt data */ }
  return { attempts: 0, lockedUntil: 0 };
}

function saveLockoutState(s: LockoutState): void {
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify(s));
}

function clearLockoutState(): void {
  localStorage.removeItem(LOCKOUT_KEY);
}

interface UnlockWalletProps {
  onUnlock: (password: string) => Promise<void>;
  onReset: () => void;
}

export function UnlockWallet({ onUnlock, onReset }: UnlockWalletProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockout, setLockout] = useState<LockoutState>(getLockoutState);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const isLockedOut = lockout.lockedUntil > Date.now();

  // Countdown timer for lockout
  useEffect(() => {
    if (!isLockedOut) {
      setRemainingSeconds(0);
      return;
    }
    const update = () => {
      const remaining = Math.max(0, Math.ceil((lockout.lockedUntil - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        setLockout((prev) => ({ ...prev, lockedUntil: 0 }));
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lockout.lockedUntil, isLockedOut]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    setError('');
    setIsLoading(true);

    try {
      await onUnlock(password);
      // Successful unlock – reset lockout
      clearLockoutState();
      setLockout({ attempts: 0, lockedUntil: 0 });
    } catch {
      const newAttempts = lockout.attempts + 1;
      let lockedUntil = 0;

      if (newAttempts >= MAX_ATTEMPTS) {
        // Exponential backoff: 30s, 60s, 120s, 240s ...
        const multiplier = Math.pow(2, Math.floor(newAttempts / MAX_ATTEMPTS) - 1);
        lockedUntil = Date.now() + BASE_LOCKOUT_MS * multiplier;
      }

      const newState: LockoutState = { attempts: newAttempts, lockedUntil };
      saveLockoutState(newState);
      setLockout(newState);

      const attemptsLeft = MAX_ATTEMPTS - (newAttempts % MAX_ATTEMPTS || MAX_ATTEMPTS);
      if (lockedUntil > 0) {
        setError('Too many failed attempts. Please wait before trying again.');
      } else {
        setError(`Invalid password. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [password, lockout, isLockedOut, onUnlock]);

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
            disabled={isLoading || isLockedOut}
            autoComplete="current-password"
            autoFocus
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        {isLockedOut && (
          <div className="lockout-message">
            Locked for {remainingSeconds}s
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || isLockedOut}
          className="primary-button"
        >
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
