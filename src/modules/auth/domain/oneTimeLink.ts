import type { AccountId } from './account.js';
import type { SessionTokenHash } from './session.js';

// Long enough for a player who signs up in the evening and reads mail the next day.
export const VERIFICATION_MS = 48 * 60 * 60 * 1000;
// A password link is a key to the account, so it is short-lived.
export const RESET_MS = 30 * 60 * 1000;

/** A one-time link from an e-mail (confirming the address, or setting a new password); only its token's hash is stored. */
export interface OneTimeLink {
  readonly tokenHash: SessionTokenHash;
  readonly accountId: AccountId;
  readonly expiresAt: Date;
}

export function startLink(
  tokenHash: SessionTokenHash,
  accountId: AccountId,
  now: Date,
  lifetimeMs: number,
): OneTimeLink {
  return { tokenHash, accountId, expiresAt: new Date(now.getTime() + lifetimeMs) };
}

export function isLinkActive(link: OneTimeLink, now: Date): boolean {
  return now < link.expiresAt;
}
