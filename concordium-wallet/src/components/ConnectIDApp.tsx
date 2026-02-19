import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { SessionTypes } from '@walletconnect/types';
import { connectToIDApp, onSessionEvent } from '../services/walletConnect';
import type { Network } from '../types';

interface ConnectIDAppProps {
  network: Network;
  onConnected: () => void;
  publicKey: string;
}

export function ConnectIDApp({ network, onConnected, publicKey }: ConnectIDAppProps) {
  const [wcUri, setWcUri] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'waiting' | 'connected'>('idle');
  const [sessionData, setSessionData] = useState<SessionTypes.Struct | null>(null);
  const [events, setEvents] = useState<string[]>([]);

  // Memoize onConnected to prevent infinite loops
  const handleOnConnected = useCallback(() => {
    onConnected();
  }, [onConnected]);

  useEffect(() => {
    // Listen for session events
    onSessionEvent((data) => {
      console.log('[ConnectIDApp] Received event:', data);
      setEvents(prev => [...prev, JSON.stringify(data, null, 2)]);
    });

    // Don't auto-restore session - let user start fresh
    // This ensures we always show the QR code flow
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    setStatus('connecting');
    setEvents([]);
    setSessionData(null);
    setWcUri(null);

    try {
      console.log('[ConnectIDApp] Starting connection for network:', network);
      const { uri, approval } = await connectToIDApp(network);
      console.log('[ConnectIDApp] Got URI:', uri);
      setWcUri(uri);
      setStatus('waiting');

      // Wait for approval
      console.log('[ConnectIDApp] Waiting for ID App approval...');
      const session = await approval;
      console.log('[ConnectIDApp] Session approved:', JSON.stringify(session, null, 2));
      setSessionData(session);
      setStatus('connected');
      // Don't auto-navigate - let user see the response first
    } catch (err) {
      console.error('[ConnectIDApp] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setStatus('idle');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleProceed = () => {
    if (sessionData) {
      handleOnConnected();
    }
  };

  const deepLink = wcUri ? `concordium://wc?uri=${encodeURIComponent(wcUri)}` : '';

  // Derive the auth code from the WC URI topic (first 4 chars, uppercased)
  const authCode = wcUri ? wcUri.replace('wc:', '').split('@')[0].substring(0, 4).toUpperCase() : '';

  return (
    <div className="connect-idapp">
      <h2>Connect to Concordium ID App</h2>
      <p>
        To create an account, you need to connect with the Concordium ID App and complete identity verification.
      </p>

      <div className="public-key-display">
        <label>Your Public Key</label>
        <code>{publicKey.slice(0, 20)}...{publicKey.slice(-20)}</code>
      </div>

      {status === 'idle' && (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="primary-button"
        >
          Connect to ID App
        </button>
      )}

      {status === 'connecting' && (
        <div className="loading">
          <div className="spinner" />
          <p>Generating connection...</p>
        </div>
      )}

      {status === 'waiting' && wcUri && (
        <div className="qr-section">
          <p className="qr-instruction">Scan this QR code with the Concordium ID App:</p>

          <div className="qr-code-container">
            <div className="qr-code">
              <QRCodeSVG value={wcUri} size={256} />
            </div>

            <div className="auth-code-display">
              <p>Verify this code in the ID App:</p>
              <div className="auth-code">{authCode}</div>
            </div>
          </div>

          <a href={deepLink} className="primary-button" style={{ marginTop: '1rem' }}>
            Open ID App on Mobile
          </a>

          <p className="hint">
            Waiting for ID App connection...
          </p>
        </div>
      )}

      {status === 'connected' && (
        <div className="success-message">
          <p>Connected to ID App!</p>
          <button onClick={handleProceed} className="primary-button" style={{ marginTop: '1rem' }}>
            Proceed to Create Account
          </button>
        </div>
      )}

      {/* Display session data */}
      {sessionData && (
        <div className="session-data">
          <h3>Session Data</h3>
          <div className="data-block">
            <label>Topic:</label>
            <code>{sessionData.topic}</code>
          </div>
          <div className="data-block">
            <label>Peer:</label>
            <code>{sessionData.peer?.metadata?.name || 'Unknown'}</code>
          </div>
          <div className="data-block">
            <label>Namespaces:</label>
            <pre>{JSON.stringify(sessionData.namespaces, null, 2)}</pre>
          </div>
          <div className="data-block">
            <label>Full Session:</label>
            <pre style={{ maxHeight: '200px', overflow: 'auto', fontSize: '12px' }}>
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Display events */}
      {events.length > 0 && (
        <div className="events-log">
          <h3>Events from ID App</h3>
          {events.map((event, idx) => (
            <pre key={idx} style={{ maxHeight: '150px', overflow: 'auto', fontSize: '12px', background: '#f5f5f5', padding: '10px', marginBottom: '10px' }}>
              {event}
            </pre>
          ))}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="idapp-download">
        <p>Don't have the ID App?</p>
        <div className="store-links">
          <a
            href="https://apps.apple.com/app/concordium-id/id1566996491"
            target="_blank"
            rel="noopener noreferrer"
          >
            App Store
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.concordium.id"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Play
          </a>
        </div>
      </div>
    </div>
  );
}
