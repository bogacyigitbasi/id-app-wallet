import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '../contexts/WalletContext';
import {
  initWalletConnect,
  getSignClient,
  onSessionEvent,
} from '../services/walletConnect';
import type { DAppSession, SignRequest } from '../types';
import { SignRequestModal } from './SignRequestModal';
import type { SessionTypes } from '@walletconnect/types';

interface DAppConnectorProps {
  onClose: () => void;
}

export function DAppConnector({ onClose }: DAppConnectorProps) {
  const { state } = useWallet();
  const [dAppSessions, setDAppSessions] = useState<DAppSession[]>([]);
  const [pairingUri, setPairingUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<SignRequest | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSessions();

    onSessionEvent((data: unknown) => {
      const event = data as { id?: number; topic?: string; params?: { request?: { method?: string; params?: unknown } } };
      if (event.params?.request) {
        // Find session for this topic
        const client = getSignClient();
        let peerName = 'Unknown dApp';
        let peerIcon: string | undefined;
        if (client && event.topic) {
          try {
            const session = client.session.get(event.topic);
            peerName = session.peer?.metadata?.name || peerName;
            peerIcon = session.peer?.metadata?.icons?.[0];
          } catch {
            // Session not found
          }
        }

        setPendingRequest({
          id: event.id || 0,
          topic: event.topic || '',
          method: event.params.request.method || 'unknown',
          params: event.params.request.params,
          peerName,
          peerIcon,
        });
      }
    });
  }, []);

  const loadSessions = async () => {
    const client = await initWalletConnect();
    const sessions = client.session.getAll();
    const mapped: DAppSession[] = sessions.map((s: SessionTypes.Struct) => ({
      topic: s.topic,
      peerName: s.peer?.metadata?.name || 'Unknown',
      peerIcon: s.peer?.metadata?.icons?.[0],
      peerUrl: s.peer?.metadata?.url,
      connectedAt: s.expiry ? (s.expiry - 604800) * 1000 : Date.now(),
    }));
    setDAppSessions(mapped);
  };

  const handleCreatePairing = async () => {
    setIsGenerating(true);
    setError('');
    setPairingUri(null);

    try {
      const client = await initWalletConnect();
      const activeAccount = state.accounts[state.activeAccountIndex];

      if (!activeAccount) {
        throw new Error('No active account');
      }

      const chainId = state.network === 'Testnet'
        ? 'concordium:testnet'
        : 'concordium:mainnet';

      const { uri, approval } = await client.connect({
        optionalNamespaces: {
          concordium: {
            methods: [
              'sign_message',
              'sign_and_send_transaction',
              'send_transaction',
            ],
            chains: [chainId],
            events: ['accounts_changed'],
          },
        },
      });

      if (uri) {
        setPairingUri(uri);

        approval().then(() => {
          setPairingUri(null);
          loadSessions();
        }).catch((err: Error) => {
          console.error('dApp pairing failed:', err);
          setError('Pairing failed or was rejected');
          setPairingUri(null);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pairing');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDisconnect = async (topic: string) => {
    try {
      const client = getSignClient();
      if (client) {
        await client.disconnect({
          topic,
          reason: { code: 6000, message: 'User disconnected' },
        });
      }
      setDAppSessions((prev) => prev.filter((s) => s.topic !== topic));
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const handleApproveRequest = async (response: unknown) => {
    if (!pendingRequest) return;

    try {
      const client = getSignClient();
      if (client) {
        await client.respond({
          topic: pendingRequest.topic,
          response: {
            id: pendingRequest.id,
            jsonrpc: '2.0',
            result: response,
          },
        });
      }
    } catch (err) {
      console.error('Failed to respond:', err);
    }

    setPendingRequest(null);
  };

  const handleRejectRequest = async () => {
    if (!pendingRequest) return;

    try {
      const client = getSignClient();
      if (client) {
        await client.respond({
          topic: pendingRequest.topic,
          response: {
            id: pendingRequest.id,
            jsonrpc: '2.0',
            error: { code: 5000, message: 'User rejected the request' },
          },
        });
      }
    } catch (err) {
      console.error('Failed to reject:', err);
    }

    setPendingRequest(null);
  };

  return (
    <div className="dapp-connector">
      <div className="modal-header">
        <h2>dApp Connections</h2>
        <button onClick={onClose} className="close-button">&times;</button>
      </div>

      {/* Connected dApps */}
      <div className="connected-dapps">
        <h3>Connected dApps ({dAppSessions.length})</h3>

        {dAppSessions.length === 0 ? (
          <p className="empty-state">No connected dApps</p>
        ) : (
          <div className="dapp-list">
            {dAppSessions.map((session) => (
              <div key={session.topic} className="dapp-item">
                <div className="dapp-icon">
                  {session.peerIcon ? (
                    <img src={session.peerIcon} alt={session.peerName} />
                  ) : (
                    <span>{session.peerName.charAt(0)}</span>
                  )}
                </div>
                <div className="dapp-info">
                  <span className="dapp-name">{session.peerName}</span>
                  {session.peerUrl && (
                    <span className="dapp-url">{session.peerUrl}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDisconnect(session.topic)}
                  className="disconnect-button"
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create new pairing */}
      <div className="new-pairing">
        <h3>Connect New dApp</h3>

        {!pairingUri ? (
          <button
            onClick={handleCreatePairing}
            disabled={isGenerating || state.accounts.length === 0}
            className="primary-button"
          >
            {isGenerating ? 'Generating...' : 'Generate QR Code'}
          </button>
        ) : (
          <div className="qr-section">
            <p>Scan this QR code with the dApp:</p>
            <div className="qr-code">
              <QRCodeSVG value={pairingUri} size={200} />
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(pairingUri);
              }}
              className="secondary-button"
            >
              Copy URI
            </button>
            <button
              onClick={() => setPairingUri(null)}
              className="text-button"
            >
              Cancel
            </button>
          </div>
        )}

        {state.accounts.length === 0 && (
          <p className="hint">Create an account first to connect dApps</p>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Sign Request Modal */}
      {pendingRequest && (
        <SignRequestModal
          request={pendingRequest}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
        />
      )}
    </div>
  );
}
