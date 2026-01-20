import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { SessionTypes } from '@walletconnect/types';
import { connectToIDApp, restoreSession, onSessionEvent } from '../services/walletConnect';
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

  useEffect(() => {
    // Listen for session events
    onSessionEvent((data) => {
      console.log('[ConnectIDApp] Received event:', data);
      setEvents(prev => [...prev, JSON.stringify(data, null, 2)]);
    });

    // Check for existing session
    restoreSession().then((session) => {
      if (session) {
        console.log('[ConnectIDApp] Restored session:', session);
        setSessionData(session);
        setStatus('connected');
        onConnected();
      }
    });
  }, [onConnected]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    setStatus('connecting');
    setEvents([]);

    try {
      const { uri, approval } = await connectToIDApp(network);
      setWcUri(uri);
      setStatus('waiting');
      console.log('[ConnectIDApp] Waiting for approval...');

      // Wait for approval
      const session = await approval;
      console.log('[ConnectIDApp] Session approved:', session);
      setSessionData(session);
      setStatus('connected');
      onConnected();
    } catch (err) {
      console.error('[ConnectIDApp] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setStatus('idle');
    } finally {
      setIsConnecting(false);
    }
  };

  const deepLink = wcUri ? `concordium://wc?uri=${encodeURIComponent(wcUri)}` : '';

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
          <p>Scan this QR code with the Concordium ID App, or click the button below if on mobile:</p>

          <div className="qr-code">
            <QRCodeSVG value={wcUri} size={256} />
          </div>

          <a href={deepLink} className="primary-button">
            Open ID App
          </a>

          <p className="hint">
            Waiting for connection from ID App...
          </p>
        </div>
      )}

      {status === 'connected' && (
        <div className="success-message">
          <p>Connected to ID App!</p>
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
