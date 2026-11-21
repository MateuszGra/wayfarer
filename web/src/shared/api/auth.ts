import type { AccountDto, AccountResponse } from '@shared/api/contracts';
import { apiGet, apiPost, ApiRequestError } from '@/shared/api/client';

/** Creates the account; the player signs in by following the link e-mailed to them. */
export function register(email: string, password: string): Promise<void> {
  return apiPost('/auth/register', { email, password });
}

export async function login(email: string, password: string): Promise<AccountDto> {
  return (await apiPost<AccountResponse>('/auth/login', { email, password })).account;
}

export function logout(): Promise<void> {
  return apiPost('/auth/logout');
}

/** The signed-in account, or null when there is no valid session. */
export async function fetchCurrentAccount(): Promise<AccountDto | null> {
  try {
    return (await apiGet<AccountResponse>('/auth/me')).account;
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === 'unauthenticated') return null;
    throw error;
  }
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return apiPost('/auth/password', { currentPassword, newPassword });
}

/** Confirms the account's address with the token from the link in the e-mail; the player is then signed in. */
export async function confirmEmail(token: string): Promise<AccountDto> {
  return (await apiPost<AccountResponse>('/auth/verify-email', { token })).account;
}

/** Confirms the address with the code from the e-mail, typed in on this device; the player is then signed in. */
export async function confirmEmailWithCode(email: string, code: string): Promise<AccountDto> {
  return (await apiPost<AccountResponse>('/auth/verify-email/code', { email, code })).account;
}

/** Asks for a fresh confirmation link; the answer is the same whether the address has an account or not. */
export function resendVerification(email: string): Promise<void> {
  return apiPost('/auth/verify-email/resend', { email });
}

/** Asks for a password link; the answer is the same whether the address has an account or not. */
export function requestPasswordReset(email: string): Promise<void> {
  return apiPost('/auth/password-reset', { email });
}

/** Sets a new password with the token from the e-mail's link; the player is then signed in. */
export async function resetPassword(token: string, newPassword: string): Promise<AccountDto> {
  return (await apiPost<AccountResponse>('/auth/password-reset/confirm', { token, newPassword })).account;
}
