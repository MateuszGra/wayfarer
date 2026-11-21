import type { AccountId } from './account.js';
import { startLink, VERIFICATION_MS, type OneTimeLink } from './oneTimeLink.js';
import type { SessionTokenHash } from './session.js';

// A million codes and five tries: a guess succeeds with a chance of 1 in 200,000 per e-mail, and e-mails
// to one address are limited too.
export const MAX_CODE_ATTEMPTS = 5;

export type CodeHash = string & { readonly __brand: 'CodeHash' };

/** A confirmation e-mail: its link, and the code that can be typed in instead. Only hashes are stored. */
export interface EmailVerification extends OneTimeLink {
  readonly codeHash: CodeHash;
}

export function startVerification(
  tokenHash: SessionTokenHash,
  codeHash: CodeHash,
  accountId: AccountId,
  now: Date,
): EmailVerification {
  return { ...startLink(tokenHash, accountId, now, VERIFICATION_MS), codeHash };
}
