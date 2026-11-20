import { describe, expect, it } from 'vitest';
import type { PasswordHash } from '../domain/account';
import { createArgon2Hasher } from './argon2Hasher';

const hasher = createArgon2Hasher();

describe('argon2 hasher', () => {
  it('stores argon2id with its parameters and salt in one PHC string', async () => {
    expect(await hasher.hash('camino2026')).toMatch(
      /^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/]{22}\$[A-Za-z0-9+/]{43}$/,
    );
  });

  it('accepts the password a hash was made from', async () => {
    const hash = await hasher.hash('camino2026');

    expect(await hasher.verify('camino2026', hash)).toBe(true);
  });

  it('rejects a different password', async () => {
    const hash = await hasher.hash('camino2026');

    expect(await hasher.verify('camino2025', hash)).toBe(false);
  });

  it('salts every hash, so one password gives two different hashes', async () => {
    expect(await hasher.hash('camino2026')).not.toBe(await hasher.hash('camino2026'));
  });

  it('rejects any password when there is no stored hash', async () => {
    expect(await hasher.verify('camino2026', null)).toBe(false);
  });

  it('rejects a stored value that is not an argon2id hash', async () => {
    expect(await hasher.verify('camino2026', 'plain-text' as PasswordHash)).toBe(false);
  });
});
