import { readonly, ref } from 'vue';
import type { AccountDto } from '@shared/api/contracts';
import { fetchCurrentAccount, logout } from '@/shared/api/auth';

// One session per tab, shared by the router guard and every screen.
const account = ref<AccountDto | null>(null);
let checked: Promise<AccountDto | null> | null = null;

/**
 * Who is signed in. The server is asked once per page load; after that, signing in and out update the
 * state directly. When the server can't be reached the player is treated as signed out and asked again
 * on the next navigation.
 */
export function useSession() {
  const ensure = async (): Promise<AccountDto | null> => {
    checked ??= fetchCurrentAccount().catch(() => {
      checked = null;
      return null;
    });
    account.value = await checked;
    return account.value;
  };
  const signedIn = (next: AccountDto): void => {
    account.value = next;
    checked = Promise.resolve(next);
  };
  const signOut = async (): Promise<void> => {
    try {
      await logout();
    } finally {
      account.value = null;
      checked = Promise.resolve(null);
    }
  };
  return { account: readonly(account), ensure, signedIn, signOut };
}

/** Test helper: forgets the session state between tests. */
export function resetSessionForTests(): void {
  account.value = null;
  checked = null;
}
