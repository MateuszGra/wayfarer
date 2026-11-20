import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetSessionForTests, useSession } from './useSession';

const api = vi.hoisted(() => ({
  fetchCurrentAccount: vi.fn<() => Promise<{ email: string } | null>>(),
  logout: vi.fn<() => Promise<void>>(),
}));
vi.mock('@/shared/api/auth', () => api);

beforeEach(() => {
  resetSessionForTests();
  api.fetchCurrentAccount.mockReset().mockResolvedValue({ email: 'ana@example.com' });
  api.logout.mockReset().mockResolvedValue(undefined);
});

describe('useSession', () => {
  it('asks the server who is signed in only once per page load', async () => {
    await useSession().ensure();

    await useSession().ensure();

    expect(api.fetchCurrentAccount).toHaveBeenCalledTimes(1);
    expect(useSession().account.value).toEqual({ email: 'ana@example.com' });
  });

  it('treats an unreachable server as signed out and asks again next time', async () => {
    api.fetchCurrentAccount.mockRejectedValueOnce(new Error('offline'));
    const first = await useSession().ensure();

    const second = await useSession().ensure();

    expect(first).toBeNull();
    expect(second).toEqual({ email: 'ana@example.com' });
  });

  it('forgets the account after signing out, even if the server could not be reached', async () => {
    await useSession().ensure();
    api.logout.mockRejectedValue(new Error('offline'));

    await useSession()
      .signOut()
      .catch(() => {});

    expect(useSession().account.value).toBeNull();
    expect(await useSession().ensure()).toBeNull();
  });
});
