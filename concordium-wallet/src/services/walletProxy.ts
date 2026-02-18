import type { Network } from '../types';

const PROXY_URLS: Record<Network, string> = {
  Testnet: 'https://wallet-proxy.testnet.concordium.com',
  Mainnet: 'https://wallet-proxy.mainnet.concordium.software',
};

function getBaseUrl(network: Network): string {
  return PROXY_URLS[network];
}

// --- Account Balance ---

export interface WalletProxyBalance {
  finalizedBalance: string;
  currentBalance: string;
  // v2 response includes staked/scheduled amounts and PLT
  stakedAmount?: string;
  scheduledBalance?: string;
  tokens?: WalletProxyTokenBalance[];
}

export interface WalletProxyTokenBalance {
  tokenId: string;
  contractIndex: string;
  contractSubindex: string;
  balance: string;
  metadata?: {
    name?: string;
    symbol?: string;
    decimals?: number;
    thumbnail?: { url?: string };
    display?: { url?: string };
  };
}

export async function getProxyAccountBalance(
  address: string,
  network: Network
): Promise<WalletProxyBalance> {
  const url = `${getBaseUrl(network)}/v2/accBalance/${address}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch balance: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// --- Transaction History ---

export interface WalletProxyTransaction {
  id: number;
  blockHash: string;
  blockTime: number; // unix timestamp in seconds
  transactionHash: string;
  sender?: string;
  cost?: string;
  energyCost?: number;
  type: {
    type: string;
    contents: string;
  };
  result: {
    outcome: 'success' | 'reject';
    rejectReason?: unknown;
  };
  details: {
    type: string;
    description: string;
    outcome: string;
    transferSource?: string;
    transferDestination?: string;
    transferAmount?: string;
    events?: unknown[];
    [key: string]: unknown;
  };
  total?: string;
  subtotal?: string;
}

export interface TransactionHistoryResponse {
  transactions: WalletProxyTransaction[];
  count: number;
  limit: number;
  order: string;
}

export async function getTransactionHistory(
  address: string,
  network: Network,
  limit: number = 20,
  from?: number
): Promise<TransactionHistoryResponse> {
  let url = `${getBaseUrl(network)}/v3/accTransactions/${address}?limit=${limit}&order=descending&includeRawRejectReason`;

  if (from !== undefined) {
    url += `&from=${from}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// --- Transaction Submission ---

export async function submitTransfer(
  payload: unknown,
  network: Network
): Promise<{ submissionId: string }> {
  const url = `${getBaseUrl(network)}/v0/submitTransfer`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit transfer: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function submitRawTransaction(
  payload: string,
  network: Network
): Promise<{ submissionId: string }> {
  const url = `${getBaseUrl(network)}/v0/submitRawTransaction`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit raw transaction: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// --- Submission Status ---

export interface SubmissionStatus {
  status: 'absent' | 'received' | 'committed' | 'finalized';
  outcome?: 'success' | 'reject';
  blockHashes?: string[];
}

export async function getSubmissionStatus(
  hash: string,
  network: Network
): Promise<SubmissionStatus> {
  const url = `${getBaseUrl(network)}/v0/submissionStatus/${hash}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to get submission status: ${response.status}`);
  }

  return response.json();
}

// --- Transaction Cost ---

export interface TransactionCostResponse {
  cost: string;
  energy: number;
}

export async function getTransactionCost(
  type: string,
  network: Network,
  params?: Record<string, string>
): Promise<TransactionCostResponse> {
  const searchParams = new URLSearchParams({ type, ...params });
  const url = `${getBaseUrl(network)}/v0/transactionCost?${searchParams}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to get transaction cost: ${response.status}`);
  }

  return response.json();
}

// --- CIS-2 Tokens ---

export interface CIS2TokenInfo {
  tokenId: string;
  metadata?: {
    name?: string;
    symbol?: string;
    decimals?: number;
    thumbnail?: { url?: string };
    display?: { url?: string };
    description?: string;
  };
}

export async function getCIS2Tokens(
  contractIndex: number,
  contractSubindex: number,
  network: Network
): Promise<CIS2TokenInfo[]> {
  const url = `${getBaseUrl(network)}/v0/CIS2Tokens/${contractIndex}/${contractSubindex}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to get CIS-2 tokens: ${response.status}`);
  }

  return response.json();
}

// --- PLT Tokens ---

export interface PLTTokenInfo {
  tokenId: string;
  contractIndex: number;
  contractSubindex: number;
  metadata?: {
    name?: string;
    symbol?: string;
    decimals?: number;
    thumbnail?: { url?: string };
    display?: { url?: string };
  };
}

export async function getPLTTokens(
  network: Network
): Promise<PLTTokenInfo[]> {
  const url = `${getBaseUrl(network)}/v0/plt/tokens`;
  const response = await fetch(url);

  if (!response.ok) {
    // PLT endpoint may not exist on all networks
    if (response.status === 404) return [];
    throw new Error(`Failed to get PLT tokens: ${response.status}`);
  }

  return response.json();
}

// --- Poll for finalization ---

export async function waitForFinalization(
  hash: string,
  network: Network,
  timeoutMs: number = 120000
): Promise<SubmissionStatus> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const status = await getSubmissionStatus(hash, network);

    if (status.status === 'finalized') {
      return status;
    }

    if (status.status === 'absent') {
      // Transaction not yet picked up, keep waiting
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error(`Transaction ${hash} did not finalize within ${timeoutMs / 1000}s`);
}
