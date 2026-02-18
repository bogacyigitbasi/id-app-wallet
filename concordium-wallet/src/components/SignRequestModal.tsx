import { useState, useMemo } from 'react';
import { useWallet } from '../contexts/WalletContext';
import * as SDK from '@concordium/web-sdk';
import type { SignRequest } from '../types';

interface SignRequestModalProps {
  request: SignRequest;
  onApprove: (response: unknown) => void;
  onReject: () => void;
}

interface ParsedTransactionInfo {
  type: string;
  sender?: string;
  receiver?: string;
  amount?: string;
  contractIndex?: number;
  contractSubindex?: number;
  method?: string;
  message?: string;
  warning?: string;
}

function parseRequestDetails(request: SignRequest, activeAddress?: string): ParsedTransactionInfo {
  const params = request.params as Record<string, unknown> | undefined;

  if (request.method === 'sign_message') {
    const msgParams = params as { message?: string } | undefined;
    const message = msgParams?.message ?? '';
    return {
      type: 'Sign Message',
      message: typeof message === 'string' ? message : JSON.stringify(message),
    };
  }

  if (request.method === 'sign_and_send_transaction' || request.method === 'send_transaction') {
    const txParams = params as { transaction?: Record<string, unknown> } | undefined;
    const tx = txParams?.transaction;

    if (!tx) {
      return { type: 'Transaction', warning: 'Could not parse transaction details' };
    }

    const header = tx.header as Record<string, unknown> | undefined;
    const payload = tx.payload as Record<string, unknown> | undefined;
    const txType = tx.type as string | undefined;

    const sender = header?.sender as string | undefined;
    const info: ParsedTransactionInfo = {
      type: txType ?? 'Unknown Transaction',
      sender,
    };

    // Validate sender matches the active account
    if (sender && activeAddress && sender !== activeAddress) {
      info.warning = `Sender address does not match your active account!`;
    }

    if (payload) {
      if (payload.amount !== undefined) {
        info.amount = String(payload.amount);
      }
      if (payload.toAddress) {
        info.receiver = String(payload.toAddress);
      }
      if (payload.contractAddress) {
        const contractAddr = payload.contractAddress as Record<string, unknown>;
        info.contractIndex = Number(contractAddr.index ?? 0);
        info.contractSubindex = Number(contractAddr.subindex ?? 0);
      }
      if (payload.receiveName) {
        info.method = String(payload.receiveName);
      }
    }

    return info;
  }

  return { type: request.method, warning: 'Unknown request type' };
}

export function SignRequestModal({ request, onApprove, onReject }: SignRequestModalProps) {
  const { state } = useWallet();
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState('');

  const activeAccount = state.accounts[state.activeAccountIndex];
  const parsed = useMemo(
    () => parseRequestDetails(request, activeAccount?.address),
    [request, activeAccount?.address]
  );

  const handleApprove = async () => {
    if (!activeAccount) {
      setError('No active account');
      return;
    }

    if (!activeAccount.signingKey) {
      setError('Wallet is locked. Please unlock first.');
      return;
    }

    setIsSigning(true);
    setError('');

    try {
      let response: unknown;

      switch (request.method) {
        case 'sign_message': {
          const params = request.params as { message: string };
          const message = params.message || '';
          const messageBytes = new TextEncoder().encode(message);

          const signer = SDK.buildAccountSigner(activeAccount.signingKey);
          const signature = await signer.sign(messageBytes.buffer);
          response = { signature };
          break;
        }

        case 'sign_and_send_transaction': {
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
          <span>{parsed.type}</span>
        </div>

        {parsed.warning && (
          <div className="sign-warning">{parsed.warning}</div>
        )}

        <div className="request-details">
          {parsed.message && (
            <div className="detail-row">
              <label>Message:</label>
              <span className="detail-value message-value">{parsed.message}</span>
            </div>
          )}

          {parsed.sender && (
            <div className="detail-row">
              <label>From:</label>
              <code className="detail-value">
                {parsed.sender.slice(0, 10)}...{parsed.sender.slice(-10)}
              </code>
            </div>
          )}

          {parsed.receiver && (
            <div className="detail-row">
              <label>To:</label>
              <code className="detail-value">
                {parsed.receiver.slice(0, 10)}...{parsed.receiver.slice(-10)}
              </code>
            </div>
          )}

          {parsed.amount && (
            <div className="detail-row">
              <label>Amount:</label>
              <span className="detail-value">{parsed.amount}</span>
            </div>
          )}

          {parsed.contractIndex !== undefined && (
            <div className="detail-row">
              <label>Contract:</label>
              <span className="detail-value">
                &lt;{parsed.contractIndex},{parsed.contractSubindex ?? 0}&gt;
              </span>
            </div>
          )}

          {parsed.method && (
            <div className="detail-row">
              <label>Method:</label>
              <span className="detail-value">{parsed.method}</span>
            </div>
          )}
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
            disabled={isSigning || !!parsed.warning}
          >
            {isSigning ? 'Signing...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}
