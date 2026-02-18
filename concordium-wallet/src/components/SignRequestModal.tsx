import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import * as SDK from '@concordium/web-sdk';
import type { SignRequest } from '../types';

interface SignRequestModalProps {
  request: SignRequest;
  onApprove: (response: unknown) => void;
  onReject: () => void;
}

export function SignRequestModal({ request, onApprove, onReject }: SignRequestModalProps) {
  const { state } = useWallet();
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState('');

  const activeAccount = state.accounts[state.activeAccountIndex];

  const handleApprove = async () => {
    if (!activeAccount) {
      setError('No active account');
      return;
    }

    setIsSigning(true);
    setError('');

    try {
      let response: unknown;

      switch (request.method) {
        case 'sign_message': {
          // Sign a message with the account key
          const params = request.params as { message: string };
          const message = params.message || '';
          const messageBytes = new TextEncoder().encode(message);

          const signer = SDK.buildAccountSigner(activeAccount.signingKey);
          const signature = await signer.sign(messageBytes.buffer);
          response = { signature };
          break;
        }

        case 'sign_and_send_transaction': {
          // Sign and send a transaction
          const txParams = request.params as {
            transaction: SDK.AccountTransaction;
          };

          const signer = SDK.buildAccountSigner(activeAccount.signingKey);
          const signature = await SDK.signTransaction(txParams.transaction, signer);

          const client = new SDK.ConcordiumGRPCWebClient(
            state.network === 'Testnet'
              ? 'https://grpc.testnet.concordium.com'
              : 'https://grpc.mainnet.concordium.software',
            20000
          );

          const txHash = await client.sendAccountTransaction(
            txParams.transaction,
            signature
          );

          response = { hash: SDK.TransactionHash.toHexString(txHash) };
          break;
        }

        case 'send_transaction': {
          // Just sign and return the signature
          const sendParams = request.params as {
            transaction: SDK.AccountTransaction;
          };
          const signer = SDK.buildAccountSigner(activeAccount.signingKey);
          const signature = await SDK.signTransaction(sendParams.transaction, signer);
          response = { signature };
          break;
        }

        default:
          throw new Error(`Unsupported method: ${request.method}`);
      }

      onApprove(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign');
    } finally {
      setIsSigning(false);
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'sign_message': return 'Sign Message';
      case 'sign_and_send_transaction': return 'Sign & Send Transaction';
      case 'send_transaction': return 'Sign Transaction';
      default: return method;
    }
  };

  return (
    <div className="sign-request-overlay">
      <div className="sign-request-modal">
        <h2>Signing Request</h2>

        <div className="request-from">
          {request.peerIcon && (
            <img src={request.peerIcon} alt={request.peerName} className="peer-icon" />
          )}
          <span className="peer-name">{request.peerName}</span>
        </div>

        <div className="request-method">
          <label>Action:</label>
          <span>{getMethodLabel(request.method)}</span>
        </div>

        <div className="request-details">
          <label>Details:</label>
          <pre>{JSON.stringify(request.params, null, 2)}</pre>
        </div>

        <div className="request-account">
          <label>Signing with:</label>
          <code>
            {activeAccount?.address.slice(0, 10)}...{activeAccount?.address.slice(-10)}
          </code>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="button-group">
          <button
            onClick={onReject}
            className="secondary-button"
            disabled={isSigning}
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            className="primary-button"
            disabled={isSigning}
          >
            {isSigning ? 'Signing...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}
