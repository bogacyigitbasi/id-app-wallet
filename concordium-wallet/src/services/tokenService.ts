import * as SDK from '@concordium/web-sdk';
import type { Network, WalletAccount, TokenBalance, TokenMetadata, Transaction } from '../types';
import { getCIS2Tokens, getProxyAccountBalance, getPLTTokens, type CIS2TokenInfo } from './walletProxy';
import { getGrpcClient } from './concordium';

// Cache contract names to avoid repeated getInstanceInfo calls
const contractNameCache = new Map<string, string>();

// ==========================================
// Token Balance Fetching (via gRPC invokeContract)
// ==========================================

/**
 * Discover token contracts from multiple sources and fetch CIS-2 balances via gRPC.
 *
 * Sources:
 * 1. wallet-proxy v2 accBalance (may include token balances directly)
 * 2. wallet-proxy PLT tokens endpoint (known PLT contracts)
 * 3. Transaction history CIS-2 events (discovered contracts)
 */
export async function getTokenBalances(
  address: string,
  network: Network,
  transactions?: Transaction[]
): Promise<TokenBalance[]> {
  const contracts = new Map<string, ContractInfo>();
  const pltContracts = new Set<string>(); // Track PLT contracts

  // Source 1: wallet-proxy v2 accBalance tokens
  try {
    const proxyBalance = await getProxyAccountBalance(address, network);
    if (proxyBalance.tokens && Array.isArray(proxyBalance.tokens)) {
      for (const pt of proxyBalance.tokens) {
        const idx = parseInt(pt.contractIndex, 10);
        const sub = parseInt(pt.contractSubindex, 10);
        if (isNaN(idx)) continue;
        const key = `${idx}-${sub}`;
        if (!contracts.has(key)) {
          contracts.set(key, { index: idx, subindex: sub, tokenIds: [pt.tokenId], proxyMetadata: pt.metadata });
        } else {
          const existing = contracts.get(key)!;
          if (!existing.tokenIds.includes(pt.tokenId)) {
            existing.tokenIds.push(pt.tokenId);
          }
          if (!existing.proxyMetadata && pt.metadata) {
            existing.proxyMetadata = pt.metadata;
          }
        }
      }
    }
  } catch {
    // wallet-proxy balance endpoint may not return tokens
  }

  // Source 2: PLT tokens endpoint (known contracts on the network)
  try {
    const pltTokens = await getPLTTokens(network);
    for (const plt of pltTokens) {
      const key = `${plt.contractIndex}-${plt.contractSubindex}`;
      pltContracts.add(key); // Mark as PLT
      if (!contracts.has(key)) {
        contracts.set(key, {
          index: plt.contractIndex,
          subindex: plt.contractSubindex,
          tokenIds: [plt.tokenId],
          proxyMetadata: plt.metadata,
        });
      } else {
        const existing = contracts.get(key)!;
        if (!existing.tokenIds.includes(plt.tokenId)) {
          existing.tokenIds.push(plt.tokenId);
        }
        if (!existing.proxyMetadata && plt.metadata) {
          existing.proxyMetadata = plt.metadata;
        }
      }
    }
  } catch {
    // PLT endpoint may not exist
  }

  // Source 3: Transaction history CIS-2 events
  const txContracts = discoverTokenContracts(transactions || []);
  for (const [key, info] of txContracts) {
    if (!contracts.has(key)) {
      contracts.set(key, info);
    } else {
      const existing = contracts.get(key)!;
      for (const tid of info.tokenIds) {
        if (!existing.tokenIds.includes(tid)) {
          existing.tokenIds.push(tid);
        }
      }
    }
  }

  // Also scan transaction events for contract updates (even without parsed tokenTransfer)
  for (const tx of (transactions || [])) {
    if (tx.type === 'update' && tx.details?.events) {
      const events = tx.details.events as unknown[];
      for (const event of events) {
        if (!event || typeof event !== 'object') continue;
        const obj = event as Record<string, unknown>;
        let updated: Record<string, unknown> | undefined;
        if (obj.Updated && typeof obj.Updated === 'object') {
          updated = obj.Updated as Record<string, unknown>;
        } else if (obj.tag === 'Updated') {
          updated = obj;
        }
        if (!updated) continue;
        const addr = updated.address as { index: number; subindex: number } | undefined;
        if (addr) {
          const key = `${addr.index}-${addr.subindex}`;
          if (!contracts.has(key)) {
            contracts.set(key, { index: addr.index, subindex: addr.subindex, tokenIds: [''] });
          }
        }
      }
    }
  }

  if (contracts.size === 0) return [];

  const client = getGrpcClient(network);
  const accountAddr = SDK.AccountAddress.fromBase58(address);
  const tokens: TokenBalance[] = [];

  for (const [key, info] of contracts) {
    try {
      const contractName = await getContractName(client, info.index, info.subindex);
      if (!contractName) continue;

      const isPLT = pltContracts.has(key); // Check if this is a PLT contract

      // Try to get token metadata from wallet-proxy CIS2Tokens endpoint
      let tokenInfos: CIS2TokenInfo[] = [];
      try {
        tokenInfos = await getCIS2Tokens(info.index, info.subindex, network);
      } catch {
        // Wallet-proxy might not know this contract
      }

      // Merge event/PLT-discovered token IDs with wallet-proxy data
      const knownTokenIds = new Set(tokenInfos.map((t) => t.tokenId));
      for (const tid of info.tokenIds) {
        if (!knownTokenIds.has(tid)) {
          // Use proxy metadata from PLT/accBalance if available
          const metaFromProxy = info.proxyMetadata;
          tokenInfos.push({
            tokenId: tid,
            metadata: metaFromProxy ? {
              name: metaFromProxy.name,
              symbol: metaFromProxy.symbol,
              decimals: metaFromProxy.decimals,
              thumbnail: metaFromProxy.thumbnail,
              display: metaFromProxy.display,
            } : undefined,
          });
        }
      }

      if (tokenInfos.length === 0) {
        tokenInfos = [{ tokenId: '' }]; // default token ID for single-token contracts
      }

      for (const tInfo of tokenInfos) {
        try {
          const balance = await queryCIS2BalanceOf(
            client,
            contractName,
            info.index,
            info.subindex,
            tInfo.tokenId,
            accountAddr
          );

          if (balance && BigInt(balance) > 0n) {
            const metadata: TokenMetadata = tInfo.metadata
              ? {
                  name: tInfo.metadata.name || 'Unknown Token',
                  symbol: tInfo.metadata.symbol || '???',
                  decimals: tInfo.metadata.decimals || 0,
                  thumbnail: tInfo.metadata.thumbnail?.url,
                  icon: tInfo.metadata.display?.url,
                }
              : {
                  name: `Token ${tInfo.tokenId || '0'}`,
                  symbol: '???',
                  decimals: 0,
                };

            tokens.push({
              tokenId: tInfo.tokenId,
              contractIndex: info.index,
              contractSubindex: info.subindex,
              balance,
              metadata,
              isPLT, // Mark PLT tokens
            });
          }
        } catch (err) {
          console.error(`[TokenService] Failed to query balance for ${key}/${tInfo.tokenId}:`, err);
        }
      }
    } catch (err) {
      console.error(`[TokenService] Failed to process contract ${key}:`, err);
    }
  }

  return tokens;
}

interface ContractInfo {
  index: number;
  subindex: number;
  tokenIds: string[];
  proxyMetadata?: {
    name?: string;
    symbol?: string;
    decimals?: number;
    thumbnail?: { url?: string };
    display?: { url?: string };
  };
}

/**
 * Extract unique contract addresses and token IDs from parsed transaction data.
 */
function discoverTokenContracts(transactions: Transaction[]): Map<string, ContractInfo> {
  const contracts = new Map<string, ContractInfo>();

  for (const tx of transactions) {
    if (tx.tokenTransfer) {
      const key = `${tx.tokenTransfer.contractIndex}-${tx.tokenTransfer.contractSubindex}`;
      const existing = contracts.get(key);
      if (existing) {
        if (!existing.tokenIds.includes(tx.tokenTransfer.tokenId)) {
          existing.tokenIds.push(tx.tokenTransfer.tokenId);
        }
      } else {
        contracts.set(key, {
          index: tx.tokenTransfer.contractIndex,
          subindex: tx.tokenTransfer.contractSubindex,
          tokenIds: [tx.tokenTransfer.tokenId],
        });
      }
    }
  }

  return contracts;
}

async function getContractName(
  client: SDK.ConcordiumGRPCWebClient,
  index: number,
  subindex: number
): Promise<string | null> {
  const key = `${index}-${subindex}`;
  if (contractNameCache.has(key)) return contractNameCache.get(key)!;

  try {
    const contractAddr = SDK.ContractAddress.create(BigInt(index), BigInt(subindex));
    const instanceInfo = await client.getInstanceInfo(contractAddr);
    const initNameStr = SDK.InitName.toString(instanceInfo.name);
    const name = initNameStr.replace(/^init_/, '');
    contractNameCache.set(key, name);
    return name;
  } catch {
    return null;
  }
}

/**
 * Query CIS-2 balanceOf via gRPC invokeContract.
 */
async function queryCIS2BalanceOf(
  client: SDK.ConcordiumGRPCWebClient,
  contractName: string,
  contractIndex: number,
  contractSubindex: number,
  tokenId: string,
  accountAddress: SDK.AccountAddress.Type
): Promise<string | null> {
  const contractAddr = SDK.ContractAddress.create(
    BigInt(contractIndex),
    BigInt(contractSubindex)
  );

  const param = serializeCIS2BalanceOfParam(tokenId, accountAddress);

  const result = await client.invokeContract({
    contract: contractAddr,
    method: SDK.ReceiveName.fromString(`${contractName}.balanceOf`),
    parameter: SDK.Parameter.fromBuffer(param.buffer as ArrayBuffer),
  });

  if (result.tag === 'success' && result.returnValue) {
    return parseCIS2BalanceOfResponse(result.returnValue);
  }

  return null;
}

/**
 * Serialize CIS-2 balanceOf query parameter.
 * Format: u16_LE(count=1) + u8(token_id_len) + token_id_bytes + u8(0=Account) + 32_bytes(address)
 */
function serializeCIS2BalanceOfParam(
  tokenId: string,
  accountAddress: SDK.AccountAddress.Type
): Uint8Array {
  const parts: Uint8Array[] = [];

  // Number of queries (u16 LE)
  parts.push(new Uint8Array([1, 0]));

  // Token ID: length (u8) + bytes
  const tokenIdBytes = hexToBytes(tokenId);
  parts.push(new Uint8Array([tokenIdBytes.length]));
  if (tokenIdBytes.length > 0) {
    parts.push(tokenIdBytes);
  }

  // Address: tag (0 = Account) + 32 bytes
  parts.push(new Uint8Array([0]));
  parts.push(SDK.AccountAddress.toBuffer(accountAddress));

  return concatUint8Arrays(parts);
}

/**
 * Parse CIS-2 balanceOf response.
 * Format: u16_LE(count) + LEB128(amount) per result
 */
function parseCIS2BalanceOfResponse(returnValue: SDK.ReturnValue.Type): string | null {
  try {
    const hex = SDK.ReturnValue.toHexString(returnValue);
    const bytes = hexToBytes(hex);

    if (bytes.length < 2) return null;

    // Skip count (u16 LE), read first balance (LEB128)
    const [balance] = leb128Decode(bytes, 2);
    return balance.toString();
  } catch {
    return null;
  }
}

// ==========================================
// CIS-2 Event Parsing (for transaction history)
// ==========================================

interface TokenTransferInfo {
  tokenId: string;
  amount: string;
  from: string;
  to: string;
  contractIndex: number;
  contractSubindex: number;
}

/**
 * Extract CIS-2 token transfer info from wallet-proxy transaction events.
 * Returns the first transfer event found, or undefined.
 */
export function extractTokenTransferFromEvents(events: unknown[]): TokenTransferInfo | undefined {
  if (!events || !Array.isArray(events)) return undefined;

  for (const event of events) {
    if (!event || typeof event !== 'object') continue;
    const obj = event as Record<string, unknown>;

    // Handle various event formats from wallet-proxy
    let updated: Record<string, unknown> | undefined;

    // Format: { Updated: { address, events, ... } }
    if (obj.Updated && typeof obj.Updated === 'object') {
      updated = obj.Updated as Record<string, unknown>;
    }
    // Format: { tag: "Updated", address: {...}, events: [...] }
    else if (obj.tag === 'Updated') {
      updated = obj;
    }

    if (!updated) continue;

    const contractAddr = updated.address as { index: number; subindex: number } | undefined;
    const innerEvents = updated.events as string[] | undefined;

    if (!contractAddr || !innerEvents || !Array.isArray(innerEvents)) continue;

    for (const hexEvent of innerEvents) {
      if (typeof hexEvent !== 'string') continue;
      const parsed = parseCIS2TransferEvent(hexEvent);
      if (parsed) {
        return {
          tokenId: parsed.tokenId,
          amount: parsed.amount,
          from: parsed.from,
          to: parsed.to,
          contractIndex: contractAddr.index,
          contractSubindex: contractAddr.subindex,
        };
      }
    }
  }

  return undefined;
}

/**
 * Parse a hex-encoded CIS-2 Transfer event.
 * CIS-2 Transfer event tag = 0xFF
 * Format: 0xFF + tokenId(u8 len + bytes) + amount(LEB128) + from(tag+addr) + to(tag+addr)
 */
function parseCIS2TransferEvent(
  hex: string
): { tokenId: string; amount: string; from: string; to: string } | null {
  try {
    const bytes = hexToBytes(hex);
    if (bytes.length < 3) return null;

    let offset = 0;
    const tag = bytes[offset++];
    if (tag !== 0xff) return null; // Not a Transfer event

    // Token ID
    const tokenIdLen = bytes[offset++];
    const tokenId =
      tokenIdLen > 0 ? bytesToHex(bytes.slice(offset, offset + tokenIdLen)) : '';
    offset += tokenIdLen;

    // Amount (LEB128)
    const [amount, nextOffset] = leb128Decode(bytes, offset);
    offset = nextOffset;

    // From address
    const fromTag = bytes[offset++];
    let from = '';
    if (fromTag === 0 && offset + 32 <= bytes.length) {
      from = accountBytesToBase58(bytes.slice(offset, offset + 32));
      offset += 32;
    } else if (fromTag === 1 && offset + 16 <= bytes.length) {
      offset += 16; // Skip contract address
    }

    // To address
    const toTag = bytes[offset++];
    let to = '';
    if (toTag === 0 && offset + 32 <= bytes.length) {
      to = accountBytesToBase58(bytes.slice(offset, offset + 32));
      offset += 32;
    } else if (toTag === 1 && offset + 16 <= bytes.length) {
      offset += 16;
    }

    return { tokenId, amount: amount.toString(), from, to };
  } catch {
    return null;
  }
}

function accountBytesToBase58(bytes: Uint8Array): string {
  try {
    const addr = SDK.AccountAddress.fromBuffer(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
    return SDK.AccountAddress.toBase58(addr);
  } catch {
    return bytesToHex(bytes);
  }
}

// ==========================================
// Format / Parse helpers
// ==========================================

export function formatTokenAmount(amount: string, decimals: number): string {
  if (decimals === 0) return amount;

  const padded = amount.padStart(decimals + 1, '0');
  const intPart = padded.slice(0, -decimals) || '0';
  const fracPart = padded.slice(-decimals).replace(/0+$/, '');

  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

export function parseTokenAmount(amount: string, decimals: number): string {
  if (decimals === 0) return amount;

  const parts = amount.split('.');
  const intPart = parts[0] || '0';
  const fracPart = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);

  const raw = BigInt(intPart) * BigInt(10 ** decimals) + BigInt(fracPart);
  return raw.toString();
}

// ==========================================
// CIS-2 Token Transfer (send)
// ==========================================

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

  const nonceResponse = await client.getNextAccountNonce(senderAddress);

  const transferParam = serializeCIS2Transfer(
    tokenId,
    amount,
    senderAddress,
    receiverAddress
  );

  const contractAddr = SDK.ContractAddress.create(
    BigInt(contractIndex),
    BigInt(contractSubindex)
  );
  const instanceInfo = await client.getInstanceInfo(contractAddr);
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

// ==========================================
// Serialization helpers
// ==========================================

function serializeCIS2Transfer(
  tokenId: string,
  amount: string,
  from: SDK.AccountAddress.Type,
  to: SDK.AccountAddress.Type
): Uint8Array {
  const parts: Uint8Array[] = [];

  // Number of transfers (u16 LE)
  parts.push(new Uint8Array([1, 0]));

  // Token ID: length (u8) + bytes
  const tokenIdBytes = hexToBytes(tokenId);
  parts.push(new Uint8Array([tokenIdBytes.length]));
  parts.push(tokenIdBytes);

  // Amount: LEB128 unsigned
  parts.push(leb128Encode(BigInt(amount)));

  // From: tag (0 = Account) + 32 bytes address
  parts.push(new Uint8Array([0]));
  parts.push(SDK.AccountAddress.toBuffer(from));

  // To: tag (0 = Account) + 32 bytes address
  parts.push(new Uint8Array([0]));
  parts.push(SDK.AccountAddress.toBuffer(to));

  // Additional data for receive hook (empty, length 0)
  parts.push(new Uint8Array([0, 0]));

  return concatUint8Arrays(parts);
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

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
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

function leb128Decode(bytes: Uint8Array, startOffset: number): [bigint, number] {
  let result = 0n;
  let shift = 0n;
  let offset = startOffset;

  while (offset < bytes.length) {
    const byte = bytes[offset++];
    result |= BigInt(byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) break;
    shift += 7n;
  }

  return [result, offset];
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
