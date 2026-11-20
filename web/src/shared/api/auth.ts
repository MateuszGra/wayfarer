import type { AccountDto, AccountResponse } from '@shared/api/contracts';
import { apiGet, apiPost, ApiRequestError } from '@/shared/api/client';

export async function register(email: string, password: string): Promise<AccountDto> {
  return (await apiPost<AccountResponse>('/auth/register', { email, password })).account;
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
