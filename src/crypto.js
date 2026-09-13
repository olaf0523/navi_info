// Reads the vault produced by scripts/encrypt-data.mjs.
const MAGIC = [0x48, 0x4e, 0x56, 0x31]; // "HNV1"
const HEADER_LENGTH = 36;
const GCM_TAG_LENGTH = 16;

export function cryptoSupported() {
  return Boolean(window.isSecureContext && globalThis.crypto?.subtle && globalThis.DecompressionStream);
}

export function parseVault(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length <= HEADER_LENGTH + GCM_TAG_LENGTH || MAGIC.some((byte, index) => bytes[index] !== byte)) {
    throw new Error('Unrecognized data file format');
  }
  return {
    iterations: new DataView(buffer).getUint32(4),
    salt: bytes.subarray(8, 24),
    iv: bytes.subarray(24, HEADER_LENGTH),
    ciphertext: bytes.subarray(HEADER_LENGTH),
  };
}

export async function deriveKey(pin, { salt, iterations }) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt'],
  );
}

// Resolves to the CSV text, or null when the key is wrong (GCM authentication fails).
export async function decryptVault(key, { iv, ciphertext }) {
  let compressed;
  try {
    compressed = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  } catch {
    return null;
  }
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

export async function exportKey(key) {
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  return btoa(String.fromCharCode(...raw));
}

export async function importKey(encoded) {
  const raw = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['decrypt']);
}
