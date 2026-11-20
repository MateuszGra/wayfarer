import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { PasswordHash } from '../domain/account.js';
import type { PasswordHasher } from '../domain/ports.js';

const argon2Async = promisify(argon2);

// OWASP's minimum argon2id setting (19 MiB, 2 passes, 1 lane): about 50 ms per hash on a modest server,
// which keeps sign-in snappy while making offline guessing expensive. Raising these only affects new hashes,
// because each hash string records the parameters it was made with.
export const ARGON2_PARAMS = { memory: 19456, passes: 2, parallelism: 1 } as const;
const SALT_BYTES = 16;
const TAG_BYTES = 32;

interface Parsed {
  readonly memory: number;
  readonly passes: number;
  readonly parallelism: number;
  readonly salt: Buffer;
  readonly tag: Buffer;
}

const b64 = (buf: Buffer): string => buf.toString('base64').replace(/=+$/, '');

// PHC string format: $argon2id$v=19$m=<KiB>,t=<passes>,p=<lanes>$<salt>$<hash>. The salt lives inside the
// stored value, one random salt per password; nothing else has to be kept to verify it.
function format(p: Omit<Parsed, 'salt' | 'tag'>, salt: Buffer, tag: Buffer): PasswordHash {
  return `$argon2id$v=19$m=${p.memory},t=${p.passes},p=${p.parallelism}$${b64(salt)}$${b64(tag)}` as PasswordHash;
}

function parse(hash: string): Parsed | null {
  const match = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/.exec(hash);
  if (!match) return null;
  const [, m, t, p, salt, tag] = match;
  return {
    memory: Number(m),
    passes: Number(t),
    parallelism: Number(p),
    salt: Buffer.from(salt ?? '', 'base64'),
    tag: Buffer.from(tag ?? '', 'base64'),
  };
}

async function derive(
  password: string,
  salt: Buffer,
  p: Omit<Parsed, 'salt' | 'tag'>,
  tagLength: number,
): Promise<Buffer> {
  return argon2Async('argon2id', { message: password, nonce: salt, tagLength, ...p });
}

export function createArgon2Hasher(): PasswordHasher {
  // Stands in for the hash of an unknown address, so a failed lookup costs as much as a wrong password.
  let decoy: Promise<PasswordHash> | null = null;
  const hash = async (password: string): Promise<PasswordHash> => {
    const salt = randomBytes(SALT_BYTES);
    return format(ARGON2_PARAMS, salt, await derive(password, salt, ARGON2_PARAMS, TAG_BYTES));
  };
  return {
    hash,
    async verify(password, stored) {
      decoy ??= hash(randomBytes(16).toString('hex'));
      const parsed = parse(stored ?? (await decoy));
      if (!parsed) return false;
      const tag = await derive(password, parsed.salt, parsed, parsed.tag.length);
      return stored !== null && timingSafeEqual(tag, parsed.tag);
    },
  };
}
