import { createHash } from 'node:crypto';
import type { BreachedPasswords } from '../domain/ports.js';

const RANGE_URL = 'https://api.pwnedpasswords.com/range/';
const TIMEOUT_MS = 3000;

/**
 * Have I Been Pwned's range API with k-anonymity: only the first 5 hex characters of the password's SHA-1
 * leave the server, and the match is made locally against the returned suffixes. Padding hides the real
 * size of the answer. If the service can't be reached the password is allowed: an outage there must not
 * stop people from signing up, and the length rule still applies.
 */
export function createPwnedPasswords(
  fetcher: typeof fetch = fetch,
  onUnavailable: (error: unknown) => void = () => {},
): BreachedPasswords {
  return {
    async isBreached(password) {
      const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
      const prefix = sha1.slice(0, 5),
        suffix = sha1.slice(5);
      try {
        const response = await fetcher(RANGE_URL + prefix, {
          headers: { 'add-padding': 'true', 'user-agent': 'wayfarer-game' },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!response.ok) throw new Error(`Pwned Passwords answered ${response.status}`);
        // Each line is SUFFIX:COUNT; padding lines have a count of 0.
        return (await response.text()).split('\n').some((line) => {
          const [lineSuffix, count] = line.trim().split(':');
          return lineSuffix === suffix && Number(count) > 0;
        });
      } catch (error) {
        onUnavailable(error);
        return false;
      }
    },
  };
}
