import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import { resetSessionForTests } from '@/shared/composables/useSession';
import { createAppRouter } from './router';

const api = vi.hoisted(() => ({
  fetchCurrentAccount: vi.fn<() => Promise<{ email: string } | null>>(),
  logout: vi.fn<() => Promise<void>>(),
}));
vi.mock('@/shared/api/auth', () => api);
// Views are lazy imports; the guard decides before any of them would load.
vi.mock('@/features/scene/views/SceneView.vue', () => ({ default: { render: () => null } }));
vi.mock('@/features/onboarding/views/StartView.vue', () => ({ default: { render: () => null } }));
vi.mock('@/features/auth/views/LoginView.vue', () => ({ default: { render: () => null } }));
vi.mock('@/features/auth/views/ForgotPasswordView.vue', () => ({ default: { render: () => null } }));

const visit = async (path: string) => {
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  return router.currentRoute.value.fullPath;
};

beforeEach(() => {
  resetSessionForTests();
  localStorage.clear();
  api.fetchCurrentAccount.mockReset().mockResolvedValue(null);
});

describe('router guard', () => {
  it.each([
    { path: '/scene', expected: '/login?redirect=/scene' },
    { path: '/start', expected: '/login?redirect=/start' },
  ])('sends a signed-out visitor from $path to sign in, keeping the address', async ({ path, expected }) => {
    expect(await visit(path)).toBe(expected);
  });

  it('lets a signed-in player into the game', async () => {
    api.fetchCurrentAccount.mockResolvedValue({ email: 'ana@example.com' });

    expect(await visit('/scene')).toBe('/scene');
  });

  it('sends a signed-in player without a planned journey from sign-in to the planner', async () => {
    api.fetchCurrentAccount.mockResolvedValue({ email: 'ana@example.com' });

    expect(await visit('/login')).toBe('/start');
  });

  it('sends a signed-in player with a planned journey from sign-in straight into the game', async () => {
    api.fetchCurrentAccount.mockResolvedValue({ email: 'ana@example.com' });
    localStorage.setItem('wayfarer.plan', JSON.stringify({ routeId: 'baltic-santiago', dailySteps: 10000 }));

    expect(await visit('/login')).toBe('/scene');
  });

  it('shows the sign-in screen to a signed-out visitor', async () => {
    expect(await visit('/login')).toBe('/login');
  });
});
