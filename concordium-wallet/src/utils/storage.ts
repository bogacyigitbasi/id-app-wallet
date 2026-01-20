import type { StoredWalletData } from '../types';

const STORAGE_KEY = 'concordium_wallet_data';

export function saveWalletData(data: StoredWalletData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadWalletData(): StoredWalletData | null {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as StoredWalletData;
  } catch {
    return null;
  }
}

export function clearWalletData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasWalletData(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
