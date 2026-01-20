import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import {
  generateAccountFromSeed,
  requestAccountCreation,
  signAndSubmitCredentialTransaction,
} from '../services/concordium';
import type { WalletAccount } from '../types';

interface CreateAccountProps {
  onAccountCreated: (account: WalletAccount) => void;
  onCancel: () => void;
}

type CreateAccountStep = 'ready' | 'requesting' | 'signing' | 'submitting' | 'confirming' | 'done' | 'error';

export function CreateAccount({ onAccountCreated, onCancel }: CreateAccountProps) {
  const { state, getNextAccountIndex, incrementAccountIndex } = useWallet();
  const [step, setStep] = useState<CreateAccountStep>('ready');
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [newAccount, setNewAccount] = useState<WalletAccount | null>(null);

  const handleCreateAccount = async () => {
    if (!state.seedPhrase) {
      setError('Wallet is locked');
      return;
    }

    setError('');
    setStep('requesting');

    try {
      const accountIndex = getNextAccountIndex();
      const keyPair = generateAccountFromSeed(state.seedPhrase, state.network, accountIndex);

      // Request account creation from ID App
      setStep('requesting');
      const response = await requestAccountCreation(keyPair.publicKey, state.network);

      if (response.status !== 'success') {
        const errMsg = response.message as { code: number; details?: string };
        throw new Error(errMsg.details || `Account creation failed with code ${errMsg.code}`);
      }

      const successMsg = response.message as {
        accountAddress: string;
        serializedCredentialDeploymentTransaction: unknown;
      };

      // Sign and submit the credential deployment transaction
      setStep('signing');
      const hash = await signAndSubmitCredentialTransaction(
        response,
        keyPair.signingKey,
        state.network
      );

      setTxHash(hash);
      setStep('confirming');

      // Create account object
      const account: WalletAccount = {
        address: successMsg.accountAddress,
        publicKey: keyPair.publicKey,
        signingKey: keyPair.signingKey,
        accountIndex,
        network: state.network,
      };

      setNewAccount(account);

      // Increment the account index counter (must happen regardless of tx success/failure)
      incrementAccountIndex();

      setStep('done');
      onAccountCreated(account);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setStep('error');

      // Still increment account index even on failure (as per spec)
      incrementAccountIndex();
    }
  };

  const getStepMessage = () => {
    switch (step) {
      case 'ready':
        return 'Ready to create a new account';
      case 'requesting':
        return 'Requesting account creation from ID App...';
      case 'signing':
        return 'Signing credential deployment transaction...';
      case 'submitting':
        return 'Submitting transaction to blockchain...';
      case 'confirming':
        return 'Waiting for transaction confirmation...';
      case 'done':
        return 'Account created successfully!';
      case 'error':
        return 'Account creation failed';
      default:
        return '';
    }
  };

  return (
    <div className="create-account">
      <h2>Create New Account</h2>

      <div className="step-indicator">
        <div className={`step ${step !== 'ready' && step !== 'error' ? 'active' : ''} ${step === 'done' ? 'completed' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Request</span>
        </div>
        <div className={`step ${['signing', 'submitting', 'confirming', 'done'].includes(step) ? 'active' : ''} ${step === 'done' ? 'completed' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Sign</span>
        </div>
        <div className={`step ${step === 'done' ? 'active completed' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Confirm</span>
        </div>
      </div>

      <div className="status-message">
        {step !== 'ready' && step !== 'error' && <div className="spinner" />}
        <p>{getStepMessage()}</p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {txHash && (
        <div className="tx-hash">
          <label>Transaction Hash</label>
          <code>{txHash}</code>
          <a
            href={`https://testnet.ccdscan.io/transactions/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
      )}

      {newAccount && step === 'done' && (
        <div className="new-account-info">
          <label>Account Address</label>
          <code>{newAccount.address}</code>
        </div>
      )}

      <div className="button-group">
        {step === 'ready' && (
          <>
            <button onClick={handleCreateAccount} className="primary-button">
              Create Account
            </button>
            <button onClick={onCancel} className="secondary-button">
              Cancel
            </button>
          </>
        )}

        {step === 'error' && (
          <>
            <button onClick={handleCreateAccount} className="primary-button">
              Try Again
            </button>
            <button onClick={onCancel} className="secondary-button">
              Cancel
            </button>
          </>
        )}

        {step === 'done' && (
          <button onClick={onCancel} className="primary-button">
            Done
          </button>
        )}
      </div>

      <p className="note">
        Note: Account creation requires identity verification through the Concordium ID App.
        This is a gasless transaction - no CCD is required.
      </p>
    </div>
  );
}
