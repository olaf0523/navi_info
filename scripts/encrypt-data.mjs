// Encrypts the company CSV so it can only be read after entering the PIN.
// Usage: DATA_PASSWORD=<15 digits> npm run encrypt-data [-- input.csv output.bin]
// File layout: "HNV1" | uint32 PBKDF2 iterations | 16-byte salt | 12-byte IV | AES-GCM(gzip(csv))
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { randomBytes, webcrypto } from 'node:crypto';

const PIN_PATTERN = /^\d{15}$/;
const ITERATIONS = 600_000;
const [input = 'hnavi_companies_merged.csv', output = 'public/data/companies.bin'] = process.argv.slice(2);
const password = process.env.DATA_PASSWORD ?? '';

if (!PIN_PATTERN.test(password)) {
  console.error('DATA_PASSWORD must be set to the 15-digit PIN.');
  process.exit(1);
}

const salt = randomBytes(16);
const iv = randomBytes(12);
const material = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await webcrypto.subtle.deriveKey(
  { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
  material,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt'],
);

const compressed = gzipSync(await readFile(input), { level: 9 });
const ciphertext = new Uint8Array(await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, compressed));

const header = Buffer.alloc(36);
header.write('HNV1', 0, 'ascii');
header.writeUInt32BE(ITERATIONS, 4);
salt.copy(header, 8);
iv.copy(header, 24);

await mkdir(dirname(output), { recursive: true });
await writeFile(output, Buffer.concat([header, ciphertext]));
console.log(`Encrypted ${input} -> ${output} (${header.length + ciphertext.length} bytes)`);
