import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import type { PasswordHash } from '../domain/account.js';
import type { PasswordHasher } from '../domain/ports.js';

// scrypt rather than argon2id: Node's built-in argon2 needs OpenSSL 3.2, and the Node builds on MyDevil
// (FreeBSD) link OpenSSL 3.0. These are one of OWASP's recommended scrypt settings (N=2^15, r=8, p=3):
// 32 MiB per hash, around 100 ms on a modest server. Raising them only affects new hashes, because each
// hash string records the parameters it was made with.
export const SCRYPT_PARAMS = { logN: 15, r: 8, p: 3 } as const;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
// The largest cost a stored hash may ask for: a forged or corrupted string must not make verification
// allocate gigabytes.
const MAX_LOG_N = 20;

type Params = { readonly logN: number; readonly r: number; readonly p: number };
interface Parsed extends Params {
  readonly salt: Buffer;
  readonly key: Buffer;
}

const b64 = (buf: Buffer): string => buf.toString('base64').replace(/=+$/, '');

// PHC string format: $scrypt$ln=<log2 N>,r=<block size>,p=<parallelism>$<salt>$<key>. The salt lives inside
// the stored value, one random salt per password; nothing else has to be kept to verify it.
function format(p: Params, salt: Buffer, key: Buffer): PasswordHash {
  return `$scrypt$ln=${p.logN},r=${p.r},p=${p.p}$${b64(salt)}$${b64(key)}` as PasswordHash;
}

function parse(hash: string): Parsed | null {
  const match = /^\$scrypt\$ln=(\d+),r=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/.exec(hash);
  if (!match) return null;
  const [, ln, r, p, salt, key] = match;
  const logN = Number(ln);
  if (logN < 1 || logN > MAX_LOG_N || Number(r) < 1 || Number(p) < 1) return null;
  return {
    logN,
    r: Number(r),
    p: Number(p),
    salt: Buffer.from(salt ?? '', 'base64'),
    key: Buffer.from(key ?? '', 'base64'),
  };
}

function derive(password: string, salt: Buffer, p: Params, keyLength: number): Promise<Buffer> {
  const N = 2 ** p.logN;
  // scrypt needs 128·N·r bytes; Node refuses anything over `maxmem` (32 MiB by default), so leave headroom.
  const options: ScryptOptions = { N, r: p.r, p: p.p, maxmem: 256 * N * p.r };
  return new Promise((resolve, reject) =>
    scrypt(password, salt, keyLength, options, (error, key) => (error ? reject(error) : resolve(key))),
  );
}

export function createScryptHasher(): PasswordHasher {
  // Stands in for the hash of an unknown address, so a failed lookup costs as much as a wrong password.
  let decoy: Promise<PasswordHash> | null = null;
  const hash = async (password: string): Promise<PasswordHash> => {
    const salt = randomBytes(SALT_BYTES);
    return format(SCRYPT_PARAMS, salt, await derive(password, salt, SCRYPT_PARAMS, KEY_BYTES));
  };
  return {
    hash,
    async verify(password, stored) {
      decoy ??= hash(randomBytes(16).toString('hex'));
      const parsed = parse(stored ?? (await decoy));
      if (!parsed || parsed.key.length === 0) return false;
      const key = await derive(password, parsed.salt, parsed, parsed.key.length);
      return stored !== null && timingSafeEqual(key, parsed.key);
    },
  };
}
