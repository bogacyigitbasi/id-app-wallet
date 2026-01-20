import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { sendCCD, parseCCDAmount, getAccountBalance, formatCCD } from '../services/concordium';

interface SendCCDProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function SendCCD({ onClose, onSuccess }: SendCCDProps) {
  const { state } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'sending' | 'done'>('form');

  const activeAccount = state.accounts[state.activeAccountIndex];

  const validateAddress = (address: string): boolean => {
    // Basic validation - Concordium addresses are base58 encoded, typically 50 chars
    return /^[1-9A-HJ-NP-Za-km-z]{50,55}$/.test(address);
  };

  const handleContinue = async () => {
    setError('');

    // Validate recipient
    if (!validateAddress(recipient)) {
      setError('Invalid recipient address');
      return;
    }

    // Validate amount
    try {
      const amountMicroCCD = parseCCDAmount(amount);
      if (amountMicroCCD <= BigInt(0)) {
        setError('Amount must be greater than 0');
        return;
      }

      // Check balance
      const balance = await getAccountBalance(activeAccount.address, state.network);
      if (amountMicroCCD > balance) {
        setError(`Insufficient balance. Available: ${formatCCD(balance)} CCD`);
        return;
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
      const amountMicroCCD = parseCCDAmount(amount);
      const hash = await sendCCD(activeAccount, recipient, amountMicroCCD, state.network);
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

  return (
    <div className="send-ccd">
      <div className="modal-header">
        <h2>Send CCD</h2>
        <button onClick={onClose} className="close-button">&times;</button>
      </div>

      {step === 'form' && (
        <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }}>
          <div className="form-group">
            <label>From</label>
            <div className="from-account">
              <code>{activeAccount.address.slice(0, 10)}...{activeAccount.address.slice(-10)}</code>
              <span className="balance">Balance: {activeAccount.balance || '0'} CCD</span>
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
            <label htmlFor="amount">Amount (CCD)</label>
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
      )}

      {step === 'confirm' && (
        <div className="confirm-transaction">
          <h3>Confirm Transaction</h3>

          <div className="tx-details">
            <div className="detail-row">
              <span className="label">To:</span>
              <code>{recipient.slice(0, 15)}...{recipient.slice(-15)}</code>
            </div>
            <div className="detail-row">
              <span className="label">Amount:</span>
              <span className="value">{amount} CCD</span>
            </div>
            <div className="detail-row">
              <span className="label">Network:</span>
              <span className="value">{state.network}</span>
            </div>
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
        <div className="sending-status">
          <div className="spinner" />
          <p>Sending transaction...</p>
        </div>
      )}

      {step === 'done' && (
        <div className="transaction-success">
          <div className="success-icon">✓</div>
          <h3>Transaction Sent!</h3>

          <div className="tx-hash">
            <label>Transaction Hash</label>
            <code>{txHash}</code>
          </div>

          <a
            href={`https://testnet.ccdscan.io/transactions/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="explorer-link"
          >
            View on Explorer
          </a>

          <button onClick={onClose} className="primary-button">
            Done
          </button>
        </div>
      )}
    </div>
  );
}
