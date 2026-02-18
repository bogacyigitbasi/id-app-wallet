import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { sendCCD, parseCCDAmount, getAccountBalance, formatCCD } from '../services/concordium';
import { sendTokenTransfer, parseTokenAmount, formatTokenAmount } from '../services/tokenService';
import type { TokenBalance } from '../types';

interface SendCCDProps {
  onClose: () => void;
  onSuccess: () => void;
  initialToken?: TokenBalance | null;
}

export function SendCCD({ onClose, onSuccess, initialToken }: SendCCDProps) {
  const { state } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'sending' | 'done'>('form');
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(initialToken || null);

  const activeAccount = state.accounts[state.activeAccountIndex];
  const tokens = activeAccount
    ? state.tokenBalances[activeAccount.address] || []
    : [];

  const isCCD = !selectedToken;

  const validateAddress = (address: string): boolean => {
    return /^[1-9A-HJ-NP-Za-km-z]{50,55}$/.test(address);
  };

  const handleContinue = async () => {
    setError('');

    if (!validateAddress(recipient)) {
      setError('Invalid recipient address');
      return;
    }

    try {
      if (isCCD) {
        const amountMicroCCD = parseCCDAmount(amount);
        if (amountMicroCCD <= BigInt(0)) {
          setError('Amount must be greater than 0');
          return;
        }

        const balance = await getAccountBalance(activeAccount.address, state.network);
        if (amountMicroCCD > balance) {
          setError(`Insufficient balance. Available: ${formatCCD(balance)} CCD`);
          return;
        }
      } else {
        const rawAmount = parseTokenAmount(amount, selectedToken!.metadata?.decimals || 0);
        if (BigInt(rawAmount) <= 0n) {
          setError('Amount must be greater than 0');
          return;
        }

        if (BigInt(rawAmount) > BigInt(selectedToken!.balance)) {
          const available = formatTokenAmount(
            selectedToken!.balance,
            selectedToken!.metadata?.decimals || 0
          );
          setError(`Insufficient balance. Available: ${available} ${selectedToken!.metadata?.symbol || ''}`);
          return;
        }
      }
    } catch {
      setError('Invalid amount');
      return;
    }

    setStep('confirm');
  };

  const handleSend = async () => {
    setError('');
    setIsLoading(true);
    setStep('sending');

    try {
      let hash: string;

      if (isCCD) {
        const amountMicroCCD = parseCCDAmount(amount);
        hash = await sendCCD(activeAccount, recipient, amountMicroCCD, state.network);
      } else {
        const rawAmount = parseTokenAmount(amount, selectedToken!.metadata?.decimals || 0);
        hash = await sendTokenTransfer(
          activeAccount,
          recipient,
          rawAmount,
          selectedToken!.tokenId,
          selectedToken!.contractIndex,
          selectedToken!.contractSubindex,
          state.network
        );
      }

      setTxHash(hash);
      setStep('done');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send transaction');
      setStep('confirm');
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplaySymbol = () => {
    if (isCCD) return 'CCD';
    return selectedToken?.metadata?.symbol || 'Token';
  };

  const getSelectedBalance = () => {
    if (isCCD) return `${activeAccount.balance || '0'} CCD`;
    return `${formatTokenAmount(selectedToken!.balance, selectedToken!.metadata?.decimals || 0)} ${selectedToken!.metadata?.symbol || ''}`;
  };

  return (
    <div className="send-view">
      <div className="send-view-header">
        <button onClick={onClose} className="back-link">&larr; Back</button>
        <h2>Send {getDisplaySymbol()}</h2>
      </div>

      {step === 'form' && (
        <div className="send-card">
          <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }}>
            <div className="form-group">
              <label>Asset</label>
              <select
                value={selectedToken ? `${selectedToken.contractIndex}-${selectedToken.tokenId}` : 'ccd'}
                onChange={(e) => {
                  if (e.target.value === 'ccd') {
                    setSelectedToken(null);
                  } else {
                    const token = tokens.find(
                      (t) => `${t.contractIndex}-${t.tokenId}` === e.target.value
                    );
                    setSelectedToken(token || null);
                  }
                  setAmount('');
                }}
              >
                <option value="ccd">CCD - Concordium</option>
                {tokens.map((token) => (
                  <option
                    key={`${token.contractIndex}-${token.tokenId}`}
                    value={`${token.contractIndex}-${token.tokenId}`}
                  >
                    {token.metadata?.symbol || 'Token'} - {token.metadata?.name || `Contract ${token.contractIndex}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>From</label>
              <div className="send-from-account">
                <code>{activeAccount.address.slice(0, 10)}...{activeAccount.address.slice(-10)}</code>
                <span className="send-from-balance">{getSelectedBalance()}</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="recipient">Recipient Address</label>
              <input
                type="text"
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter Concordium address"
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount ({getDisplaySymbol()})</label>
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="button-group">
              <button type="button" onClick={onClose} className="secondary-button">
                Cancel
              </button>
              <button type="submit" className="primary-button">
                Continue
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'confirm' && (
        <div className="send-card">
          <h3>Confirm Transaction</h3>

          <div className="send-confirm-details">
            <div className="detail-row">
              <span className="label">Asset</span>
              <span className="value">{getDisplaySymbol()}</span>
            </div>
            <div className="detail-row">
              <span className="label">To</span>
              <code>{recipient.slice(0, 15)}...{recipient.slice(-15)}</code>
            </div>
            <div className="detail-row">
              <span className="label">Amount</span>
              <span className="value">{amount} {getDisplaySymbol()}</span>
            </div>
            <div className="detail-row">
              <span className="label">Network</span>
              <span className="value">{state.network}</span>
            </div>
            {!isCCD && (
              <div className="detail-row">
                <span className="label">Note</span>
                <span className="value hint">CCD fee deducted from CCD balance</span>
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button onClick={() => setStep('form')} className="secondary-button" disabled={isLoading}>
              Back
            </button>
            <button onClick={handleSend} className="primary-button" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Confirm & Send'}
            </button>
          </div>
        </div>
      )}

      {step === 'sending' && (
        <div className="send-card send-status-card">
          <div className="spinner" />
          <p>Sending transaction...</p>
        </div>
      )}

      {step === 'done' && (
        <div className="send-card send-status-card">
          <div className="success-icon">&#10003;</div>
          <h3>Transaction Sent!</h3>

          <div className="send-tx-hash">
            <label>Transaction Hash</label>
            <code>{txHash}</code>
          </div>

          <a
            href={`https://testnet.ccdscan.io/?dcount=2&dentity=transaction&dhash=${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="explorer-link"
          >
            View on Explorer
          </a>

          <button onClick={onClose} className="primary-button" style={{ width: '100%' }}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}
