import * as SDK from '@concordium/web-sdk';
import type { Network, WalletAccount, TokenBalance, TokenMetadata } from '../types';
import {
  getProxyAccountBalance,
  type WalletProxyTokenBalance,
} from './walletProxy';
import { getGrpcClient } from './concordium';

/**
 * Fetch token balances for an account from wallet-proxy v2 balance endpoint.
 */
export async function getTokenBalances(
  address: string,
  network: Network
): Promise<TokenBalance[]> {
  const balance = await getProxyAccountBalance(address, network);

  if (!balance.tokens || balance.tokens.length === 0) {
    return [];
  }

  return balance.tokens.map(mapProxyTokenToBalance);
}

function mapProxyTokenToBalance(token: WalletProxyTokenBalance): TokenBalance {
  const metadata: TokenMetadata | undefined = token.metadata
    ? {
        name: token.metadata.name || 'Unknown Token',
        symbol: token.metadata.symbol || '???',
        decimals: token.metadata.decimals || 0,
        thumbnail: token.metadata.thumbnail?.url,
        icon: token.metadata.display?.url,
      }
    : undefined;

  return {
    tokenId: token.tokenId,
    contractIndex: parseInt(token.contractIndex, 10),
    contractSubindex: parseInt(token.contractSubindex, 10),
    balance: token.balance,
    metadata,
  };
}

/**
 * Format a token amount with proper decimals.
 */
export function formatTokenAmount(amount: string, decimals: number): string {
  if (decimals === 0) return amount;

  const padded = amount.padStart(decimals + 1, '0');
  const intPart = padded.slice(0, -decimals) || '0';
  const fracPart = padded.slice(-decimals).replace(/0+$/, '');

  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

/**
 * Parse a token amount string to raw integer string.
 */
export function parseTokenAmount(amount: string, decimals: number): string {
  if (decimals === 0) return amount;

  const parts = amount.split('.');
  const intPart = parts[0] || '0';
  const fracPart = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);

  const raw = BigInt(intPart) * BigInt(10 ** decimals) + BigInt(fracPart);
  return raw.toString();
}

/**
 * Send a CIS-2 token transfer using the updateContract transaction type.
 * CIS-2 `transfer` entrypoint expects a list of transfers serialized per the CIS-2 spec.
 */
export async function sendTokenTransfer(
  fromAccount: WalletAccount,
  toAddress: string,
  amount: string,
  tokenId: string,
  contractIndex: number,
  contractSubindex: number,
  network: Network
): Promise<string> {
  const client = getGrpcClient(network);
  const senderAddress = SDK.AccountAddress.fromBase58(fromAccount.address);
  const receiverAddress = SDK.AccountAddress.fromBase58(toAddress);

  // Get nonce
  const nonceResponse = await client.getNextAccountNonce(senderAddress);

  // Serialize CIS-2 transfer parameter
  // Format: LEB128(count) + for each: tokenId + amount + from + to(list)
  const transferParam = serializeCIS2Transfer(
    tokenId,
    amount,
    senderAddress,
    receiverAddress
  );

  // Build the contract name - we need to get it from the contract instance
  const contractAddr = SDK.ContractAddress.create(BigInt(contractIndex), BigInt(contractSubindex));
  const instanceInfo = await client.getInstanceInfo(contractAddr);
  // InitName is like "init_cis2_multi" - strip "init_" prefix to get contract name
  const initNameStr = SDK.InitName.toString(instanceInfo.name);
  const contractName = initNameStr.replace(/^init_/, '');
  const receiveName = SDK.ReceiveName.fromString(`${contractName}.transfer`);

  const accountTransaction: SDK.AccountTransaction = {
    header: {
      sender: senderAddress,
      nonce: nonceResponse.nonce,
      expiry: SDK.TransactionExpiry.futureMinutes(5),
    },
    type: SDK.AccountTransactionType.Update,
    payload: {
      amount: SDK.CcdAmount.zero(),
      address: contractAddr,
      receiveName,
      message: SDK.Parameter.fromBuffer(transferParam.buffer as ArrayBuffer),
      maxContractExecutionEnergy: SDK.Energy.create(30000),
    },
  };

  const signer = SDK.buildAccountSigner(fromAccount.signingKey);
  const signature = await SDK.signTransaction(accountTransaction, signer);
  const txHash = await client.sendAccountTransaction(accountTransaction, signature);

  return SDK.TransactionHash.toHexString(txHash);
}

/**
 * Serialize a single CIS-2 transfer according to the CIS-2 specification.
 * See: https://proposals.concordium.software/CIS/cis-2.html#transfer
 */
function serializeCIS2Transfer(
  tokenId: string,
  amount: string,
  from: SDK.AccountAddress.Type,
  to: SDK.AccountAddress.Type
): Uint8Array {
  const parts: Uint8Array[] = [];

  // Number of transfers (u16 LE) - 1 transfer
  parts.push(new Uint8Array([1, 0]));

  // Token ID: length (u8) + bytes
  const tokenIdBytes = hexToBytes(tokenId);
  parts.push(new Uint8Array([tokenIdBytes.length]));
  parts.push(tokenIdBytes);

  // Amount: LEB128 unsigned
  parts.push(leb128Encode(BigInt(amount)));

  // From: tag (0 = Account) + 32 bytes address
  parts.push(new Uint8Array([0])); // Account tag
  parts.push(SDK.AccountAddress.toBuffer(from));

  // To: Receiver tag (0 = Account) + 32 bytes address
  parts.push(new Uint8Array([0])); // Account tag
  parts.push(SDK.AccountAddress.toBuffer(to));

  // Additional data for receive hook (empty, length 0)
  parts.push(new Uint8Array([0, 0])); // u16 LE length = 0

  // Concatenate all parts
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length === 0) return new Uint8Array(0);
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function leb128Encode(value: bigint): Uint8Array {
  const bytes: number[] = [];
  let v = value;
  do {
    let byte = Number(v & 0x7fn);
    v >>= 7n;
    if (v > 0n) byte |= 0x80;
    bytes.push(byte);
  } while (v > 0n);
  return new Uint8Array(bytes);
}
