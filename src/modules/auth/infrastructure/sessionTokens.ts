import { createHash, randomBytes } from 'node:crypto';
import type { SessionTokens } from '../domain/ports.js';
import type { SessionTokenHash } from '../domain/session.js';

// 32 random bytes: far beyond guessing. A plain SHA-256 is enough to store it (unlike a password, the
// token has full entropy, so there is nothing to brute-force).
const hashOf = (token: string): SessionTokenHash =>
  createHash('sha256').update(token).digest('hex') as SessionTokenHash;

export const sessionTokens: SessionTokens = {
  issue() {
    const token = randomBytes(32).toString('base64url');
    return { token, hash: hashOf(token) };
  },
  hashOf,
};
