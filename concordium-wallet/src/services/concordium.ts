import {
  ConcordiumIDAppSDK,
  type CreateAccountCreationRequestMessage,
  type CreateAccountCreationResponse,
  type SignedCredentialDeploymentTransaction,
  type KeyAccount,
  type SerializedCredentialDeploymentDetails,
} from '@concordium/id-app-sdk';
import * as SDK from '@concordium/web-sdk';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import type { Network, WalletAccount, CCDAccountKeyPair } from '../types';
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

/**
 * Generate a new BIP39 24-word seed phrase using CSPRNG.
 */
export function generateSeedPhrase(): string {
  return generateMnemonic(wordlist, 256);
}

export function generateAccountFromSeed(
  seedPhrase: string,
  network: Network,
  accountIndex: number = 0
): CCDAccountKeyPair {
  const wallet = SDK.ConcordiumHdWallet.fromSeedPhrase(seedPhrase, network);
  // Identity provider index = 0, identity index = 0 (managed by IDApp)
  const publicKey = wallet.getAccountPublicKey(0, 0, accountIndex).toString('hex');
  const signingKey = wallet.getAccountSigningKey(0, 0, accountIndex).toString('hex');
  return { publicKey, signingKey };
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
  fromAccount: WalletAccount,
  toAddress: string,
  amountMicroCCD: bigint,
  network: Network
): Promise<string> {
  const client = getGrpcClient(network);

  // Get the next nonce for the sender account
  const senderAddress = SDK.AccountAddress.fromBase58(fromAccount.address);
  const nonceResponse = await client.getNextAccountNonce(senderAddress);

  // Build the legacy AccountTransaction format (what gRPC client expects)
  const accountTransaction: SDK.AccountTransaction = {
    header: {
      sender: senderAddress,
      nonce: nonceResponse.nonce,
      expiry: SDK.TransactionExpiry.futureMinutes(5),
    },
    type: SDK.AccountTransactionType.Transfer,
    payload: {
      amount: SDK.CcdAmount.fromMicroCcd(amountMicroCCD),
      toAddress: SDK.AccountAddress.fromBase58(toAddress),
    },
  };

  // Create signer from the account's signing key
  const signer = SDK.buildAccountSigner(fromAccount.signingKey);

  // Sign the transaction
  const signature = await SDK.signTransaction(accountTransaction, signer);

  // Submit via gRPC
  const txHash = await client.sendAccountTransaction(accountTransaction, signature);

  return SDK.TransactionHash.toHexString(txHash);
}

export function estimateTransferCost(): { energy: bigint; cost: bigint } {
  // Simple transfer costs a fixed 300 energy on Concordium
  const SIMPLE_TRANSFER_ENERGY = 300n;
  // Approximate NRG to microCCD conversion (varies by chain parameters)
  const cost = SIMPLE_TRANSFER_ENERGY * 1000n;
  return { energy: SIMPLE_TRANSFER_ENERGY, cost };
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
