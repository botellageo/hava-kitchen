/**
 * PIN hashing via PBKDF2 (Web Crypto natif — supporté en browser + jsdom).
 *
 * Paramètres :
 * - Hash : SHA-256
 * - Itérations : 100 000
 * - Salt : 16 bytes aléatoires (crypto.getRandomValues)
 * - Clé dérivée : 32 bytes
 *
 * Stockage Firestore : hex strings (compactes, JSON-safe).
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const PIN_PATTERN = /^\d{4,6}$/;

export interface HashedPin {
  hash: string;
  salt: string;
}

export function isValidPinFormat(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string de longueur impaire');
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) {
      throw new Error('Caractère hex invalide');
    }
    out[i] = byte;
  }
  return out;
}

async function derive(pin: string, saltBytes: Uint8Array): Promise<Uint8Array> {
  const pinBytes = new TextEncoder().encode(pin);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinBytes as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPin(pin: string): Promise<HashedPin> {
  if (!isValidPinFormat(pin)) {
    throw new Error('PIN invalide : 4 à 6 chiffres requis.');
  }
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hashBytes = await derive(pin, salt);
  return { hash: bytesToHex(hashBytes), salt: bytesToHex(salt) };
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyPin(pin: string, hash: string, salt: string): Promise<boolean> {
  if (!isValidPinFormat(pin)) return false;
  let saltBytes: Uint8Array;
  try {
    saltBytes = hexToBytes(salt);
  } catch {
    return false;
  }
  const derived = await derive(pin, saltBytes);
  return constantTimeEqual(bytesToHex(derived), hash);
}
