import { describe, expect, it } from 'vitest';
import type { PasswordHash } from '../domain/account';
import { createScryptHasher } from './scryptHasher';

const hasher = createScryptHasher();

describe('scrypt hasher', () => {
  it('stores scrypt with its parameters and salt in one PHC string', async () => {
    expect(await hasher.hash('camino2026')).toMatch(/^\$scrypt\$ln=15,r=8,p=3\$[A-Za-z0-9+/]{22}\$[A-Za-z0-9+/]{43}$/);
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

  it('rejects a stored value that is not a scrypt hash', async () => {
    expect(await hasher.verify('camino2026', 'plain-text' as PasswordHash)).toBe(false);
  });

  it('rejects a stored hash asking for a cost above 2^20 instead of computing it', async () => {
    const forged =
      '$scrypt$ln=30,r=8,p=1$c2FsdHNhbHRzYWx0c2FsdA$aGFzaGhhc2hoYXNoaGFzaGhhc2hoYXNoaGFzaGhhc2g' as PasswordHash;

    expect(await hasher.verify('camino2026', forged)).toBe(false);
  });
});
