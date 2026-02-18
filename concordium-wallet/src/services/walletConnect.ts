import SignClient from '@walletconnect/sign-client';
import type { SessionTypes } from '@walletconnect/types';
import { ConcordiumIDAppSDK } from '@concordium/id-app-sdk';
import type { Network } from '../types';

const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string;

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

  signClient = await SignClient.init({
    projectId: WALLETCONNECT_PROJECT_ID,
    metadata: {
      name: 'Concordium Web Wallet',
      description: 'A web wallet for Concordium blockchain',
      url: window.location.origin,
      icons: ['https://concordium.com/favicon.ico'],
    },
  });

  signClient.on('session_event', (event) => {
    sessionCallbacks.forEach(cb => cb(event));
  });

  signClient.on('session_update', () => {
    // Session updated
  });

  signClient.on('session_delete', () => {
    currentSession = null;
  });

  signClient.on('session_request', (event) => {
    sessionCallbacks.forEach(cb => cb(event));
  });

  return signClient;
}

export async function connectToIDApp(network: Network): Promise<{ uri: string; approval: Promise<SessionTypes.Struct> }> {
  const client = await initWalletConnect();

  const chainId = network === 'Testnet'
    ? ConcordiumIDAppSDK.chainId.Testnet
    : ConcordiumIDAppSDK.chainId.Mainnet;

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

  const approvalPromise = approval().then((session: SessionTypes.Struct) => {
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
    currentSession = sessions[sessions.length - 1];
    return currentSession;
  }

  return null;
}
