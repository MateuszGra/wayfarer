import { describe, expect, it } from 'vitest';
import { createPwnedPasswords } from './pwnedPasswords';

// SHA-1 of "password" is 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8: prefix 5BAA6, suffix 1E4C9B93F3F0682250B6CF8331B7EE68FD8.
const SUFFIX = '1E4C9B93F3F0682250B6CF8331B7EE68FD8';
const answering = (body: string, calls: string[] = []): typeof fetch =>
  (async (url: string | URL | Request) => {
    calls.push(String(url));
    return new Response(body);
  }) as typeof fetch;

describe('Pwned Passwords check', () => {
  it('sends only the first five characters of the SHA-1', async () => {
    const calls: string[] = [];

    await createPwnedPasswords(answering('', calls)).isBreached('password');

    expect(calls).toEqual(['https://api.pwnedpasswords.com/range/5BAA6']);
  });

  it('reports a password whose suffix is listed with a count', async () => {
    const check = createPwnedPasswords(answering(`0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n${SUFFIX}:9545824\r\n`));

    expect(await check.isBreached('password')).toBe(true);
  });

  it('ignores a padding line with a count of zero', async () => {
    const check = createPwnedPasswords(answering(`${SUFFIX}:0\r\n`));

    expect(await check.isBreached('password')).toBe(false);
  });

  it('allows a password whose suffix is not listed', async () => {
    const check = createPwnedPasswords(answering('0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n'));

    expect(await check.isBreached('password')).toBe(false);
  });

  it('allows the password and reports the outage when the service cannot be reached', async () => {
    const problems: unknown[] = [];
    const failing = (async () => Promise.reject(new Error('offline'))) as typeof fetch;

    const breached = await createPwnedPasswords(failing, (error) => problems.push(error)).isBreached('password');

    expect(breached).toBe(false);
    expect(problems).toHaveLength(1);
  });

  it('allows the password when the service answers with an error status', async () => {
    const down = (async () => new Response('', { status: 503 })) as typeof fetch;

    expect(await createPwnedPasswords(down).isBreached('password')).toBe(false);
  });
});
