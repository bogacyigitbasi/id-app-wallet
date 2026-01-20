import {
  ConcordiumIDAppSDK,
  type CreateAccountCreationRequestMessage,
  type CreateAccountCreationResponse,
  type SignedCredentialDeploymentTransaction,
  type CCDAccountKeyPair,
  type KeyAccount,
  type SerializedCredentialDeploymentDetails,
} from '@concordium/id-app-sdk';
import * as SDK from '@concordium/web-sdk';
import type { Network, WalletAccount } from '../types';
import { getSession, getSignClient } from './walletConnect';

// Concordium Testnet gRPC endpoint
const TESTNET_GRPC_URL = 'https://grpc.testnet.concordium.com';
const TESTNET_GRPC_PORT = 20000;

let grpcClient: SDK.ConcordiumGRPCWebClient | null = null;

export function getGrpcClient(network: Network): SDK.ConcordiumGRPCWebClient {
  if (grpcClient) return grpcClient;

  const url = network === 'Testnet' ? TESTNET_GRPC_URL : 'https://grpc.mainnet.concordium.software';
  const port = network === 'Testnet' ? TESTNET_GRPC_PORT : 20000;

  grpcClient = new SDK.ConcordiumGRPCWebClient(url, port);
  return grpcClient;
}

export function generateAccountFromSeed(
  seedPhrase: string,
  network: Network,
  accountIndex: number = 0
): CCDAccountKeyPair {
  return ConcordiumIDAppSDK.generateAccountWithSeedPhrase(seedPhrase, network, accountIndex);
}

export function createAccountCreationRequest(
  publicKey: string,
  reason: string = 'Creating new Concordium account'
): CreateAccountCreationRequestMessage {
  return ConcordiumIDAppSDK.getCreateAccountCreationRequest(publicKey, reason);
}

export async function requestAccountCreation(
  publicKey: string,
  network: Network
): Promise<CreateAccountCreationResponse> {
  const session = getSession();
  const client = getSignClient();

  if (!session || !client) {
    throw new Error('No active WalletConnect session');
  }

  const chainId = network === 'Testnet'
    ? ConcordiumIDAppSDK.chainId.Testnet
    : ConcordiumIDAppSDK.chainId.Mainnet;

  const request = createAccountCreationRequest(publicKey);

  const response = await client.request<CreateAccountCreationResponse>({
    topic: session.topic,
    chainId,
    request: {
      method: 'create_account',
      params: { message: request },
    },
  });

  return response;
}

export async function signAndSubmitCredentialTransaction(
  response: CreateAccountCreationResponse,
  signingKey: string,
  network: Network
): Promise<string> {
  if (response.status !== 'success') {
    throw new Error('Account creation response indicates failure');
  }

  const message = response.message as {
    serializedCredentialDeploymentTransaction: SerializedCredentialDeploymentDetails;
    accountAddress: string;
  };

  // Sign the credential deployment transaction
  const signedTx: SignedCredentialDeploymentTransaction =
    await ConcordiumIDAppSDK.signCredentialTransaction(
      message.serializedCredentialDeploymentTransaction,
      signingKey
    );

  // Submit the transaction to the blockchain
  const txHash = await ConcordiumIDAppSDK.submitCCDTransaction(
    signedTx.credentialDeploymentTransaction,
    signedTx.signature,
    network
  );

  return txHash;
}

export async function getAccountBalance(
  accountAddress: string,
  network: Network
): Promise<bigint> {
  const client = getGrpcClient(network);

  try {
    const accountInfo = await client.getAccountInfo(
      SDK.AccountAddress.fromBase58(accountAddress)
    );

    return accountInfo.accountAmount.microCcdAmount;
  } catch (error) {
    console.error('Failed to get account balance:', error);
    return BigInt(0);
  }
}

export function formatCCD(microCCD: bigint): string {
  const ccd = Number(microCCD) / 1_000_000;
  return ccd.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

export function parseCCDAmount(ccd: string): bigint {
  const amount = parseFloat(ccd);
  if (isNaN(amount) || amount < 0) {
    throw new Error('Invalid CCD amount');
  }
  return BigInt(Math.floor(amount * 1_000_000));
}

export async function sendCCD(
  _fromAccount: WalletAccount,
  _toAddress: string,
  _amountMicroCCD: bigint,
  _network: Network
): Promise<string> {
  // TODO: Implement CCD transfer using Concordium Web SDK
  // This requires proper transaction signing and submission
  // For MVP, focus is on account creation via ID App SDK
  throw new Error('CCD transfer not yet implemented. Use the Concordium ID App or browser wallet for transfers.');
}

export async function recoverAccounts(
  publicKey: string,
  network: Network
): Promise<KeyAccount[]> {
  return ConcordiumIDAppSDK.getKeyAccounts(publicKey, network);
}

export async function waitForTransactionFinalization(
  txHash: string,
  network: Network,
  timeoutMs: number = 60000
): Promise<boolean> {
  const client = getGrpcClient(network);
  const hash = SDK.TransactionHash.fromHexString(txHash);

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const status = await client.getBlockItemStatus(hash);

      if (status.status === 'finalized') {
        return true;
      }
    } catch {
      // Transaction not found yet, continue waiting
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return false;
}
