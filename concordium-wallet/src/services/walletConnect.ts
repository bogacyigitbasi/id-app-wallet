import SignClient from '@walletconnect/sign-client';
import type { SessionTypes } from '@walletconnect/types';
import { ConcordiumIDAppSDK } from '@concordium/id-app-sdk';
import type { Network } from '../types';

// WalletConnect Project ID - you need to get this from https://cloud.walletconnect.com/
const WALLETCONNECT_PROJECT_ID = '20a51a980d4d81f9c173302892b70799';

let signClient: SignClient | null = null;
let currentSession: SessionTypes.Struct | null = null;

// Callbacks for session events
type SessionCallback = (data: unknown) => void;
const sessionCallbacks: SessionCallback[] = [];

export function onSessionEvent(callback: SessionCallback): void {
  sessionCallbacks.push(callback);
}

export async function initWalletConnect(): Promise<SignClient> {
  if (signClient) return signClient;

  console.log('[WalletConnect] Initializing with project ID:', WALLETCONNECT_PROJECT_ID);

  signClient = await SignClient.init({
    projectId: WALLETCONNECT_PROJECT_ID,
    metadata: {
      name: 'Concordium Web Wallet',
      description: 'A web wallet for Concordium blockchain',
      url: window.location.origin,
      icons: ['https://concordium.com/favicon.ico'],
    },
  });

  console.log('[WalletConnect] Client initialized successfully');

  // Handle session events
  signClient.on('session_event', (event) => {
    console.log('[WalletConnect] Session event received:', JSON.stringify(event, null, 2));
    sessionCallbacks.forEach(cb => cb(event));
  });

  signClient.on('session_update', ({ topic, params }) => {
    console.log('[WalletConnect] Session updated:', { topic, params });
  });

  signClient.on('session_delete', () => {
    console.log('[WalletConnect] Session deleted');
    currentSession = null;
  });

  signClient.on('session_request', (event) => {
    console.log('[WalletConnect] Session request received:', JSON.stringify(event, null, 2));
    sessionCallbacks.forEach(cb => cb(event));
  });

  // Log all core events
  signClient.core.on('connect', () => {
    console.log('[WalletConnect Core] Connected');
  });

  signClient.core.on('disconnect', () => {
    console.log('[WalletConnect Core] Disconnected');
  });

  return signClient;
}

export async function connectToIDApp(network: Network): Promise<{ uri: string; approval: Promise<SessionTypes.Struct> }> {
  const client = await initWalletConnect();

  const chainId = network === 'Testnet'
    ? ConcordiumIDAppSDK.chainId.Testnet
    : ConcordiumIDAppSDK.chainId.Mainnet;

  console.log('[WalletConnect] Connecting with chainId:', chainId);

  const { uri, approval } = await client.connect({
    optionalNamespaces: {
      concordium: {
        methods: ['create_account'],
        chains: [chainId],
        events: [],
      },
    },
  });

  if (!uri) {
    throw new Error('Failed to generate WalletConnect URI');
  }

  console.log('[WalletConnect] Generated URI:', uri);

  // Wait for approval and store session
  const approvalPromise = approval().then((session: SessionTypes.Struct) => {
    console.log('[WalletConnect] Session approved!');
    console.log('[WalletConnect] Session data:', JSON.stringify(session, null, 2));
    console.log('[WalletConnect] Session topic:', session.topic);
    console.log('[WalletConnect] Session namespaces:', JSON.stringify(session.namespaces, null, 2));
    console.log('[WalletConnect] Peer metadata:', JSON.stringify(session.peer, null, 2));
    currentSession = session;
    return session;
  });

  return { uri, approval: approvalPromise };
}

export function getSession(): SessionTypes.Struct | null {
  return currentSession;
}

export function setSession(session: SessionTypes.Struct): void {
  currentSession = session;
}

export async function disconnectSession(): Promise<void> {
  if (!signClient || !currentSession) return;

  await signClient.disconnect({
    topic: currentSession.topic,
    reason: {
      code: 6000,
      message: 'User disconnected',
    },
  });

  currentSession = null;
}

export function getSignClient(): SignClient | null {
  return signClient;
}

export async function restoreSession(): Promise<SessionTypes.Struct | null> {
  const client = await initWalletConnect();
  const sessions = client.session.getAll();

  if (sessions.length > 0) {
    // Get the most recent session
    currentSession = sessions[sessions.length - 1];
    return currentSession;
  }

  return null;
}
