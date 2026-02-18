const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const LEGACY_SALT = 'concordium-wallet-salt';

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await deriveKey(password, salt);
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  // Format: salt(16) | iv(12) | ciphertext
  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + encrypted.byteLength);
  combined.set(salt);
  combined.set(iv, SALT_LENGTH);
  combined.set(new Uint8Array(encrypted), SALT_LENGTH + IV_LENGTH);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptData(encryptedData: string, password: string): Promise<string> {
  const combined = new Uint8Array(
    atob(encryptedData)
      .split('')
      .map((c) => c.charCodeAt(0))
  );

  // Try new format first: salt(16) | iv(12) | ciphertext
  if (combined.length > SALT_LENGTH + IV_LENGTH) {
    try {
      const salt = combined.slice(0, SALT_LENGTH);
      const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const data = combined.slice(SALT_LENGTH + IV_LENGTH);
      const key = await deriveKey(password, salt);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      return new TextDecoder().decode(decrypted);
    } catch {
      // Fall through to legacy format
    }
  }

  // Legacy format: iv(12) | ciphertext (static salt)
  const legacySalt = new TextEncoder().encode(LEGACY_SALT);
  const key = await deriveKey(password, legacySalt);
  const iv = combined.slice(0, IV_LENGTH);
  const data = combined.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}
