import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import { forgetJourney } from '@/shared/composables/useJourney';
import { resetSessionForTests } from '@/shared/composables/useSession';
import { createAppRouter } from './router';

const api = vi.hoisted(() => ({
  fetchCurrentAccount: vi.fn<() => Promise<{ email: string } | null>>(),
  logout: vi.fn<() => Promise<void>>(),
}));
vi.mock('@/shared/api/auth', () => api);
const journeyApi = vi.hoisted(() => ({ fetchJourney: vi.fn<() => Promise<object | null>>() }));
vi.mock('@/shared/api/journey', () => journeyApi);
const A_JOURNEY = { journey: { routeId: 'baltic-santiago' }, today: { day: 1 } };
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
  forgetJourney();
  api.fetchCurrentAccount.mockReset().mockResolvedValue(null);
  journeyApi.fetchJourney.mockReset().mockResolvedValue(null);
});

describe('router guard', () => {
  it.each([
    { path: '/scene', expected: '/login?redirect=/scene' },
    { path: '/start', expected: '/login?redirect=/start' },
  ])('sends a signed-out visitor from $path to sign in, keeping the address', async ({ path, expected }) => {
    expect(await visit(path)).toBe(expected);
  });

  it('lets a signed-in player with a planned journey into the game', async () => {
    api.fetchCurrentAccount.mockResolvedValue({ email: 'ana@example.com' });
    journeyApi.fetchJourney.mockResolvedValue(A_JOURNEY);

    expect(await visit('/scene')).toBe('/scene');
  });

  it('sends a signed-in player without a journey to plan one first', async () => {
    api.fetchCurrentAccount.mockResolvedValue({ email: 'ana@example.com' });

    expect(await visit('/scene')).toBe('/start');
  });

  it('sends a signed-in player from sign-in on to the game', async () => {
    api.fetchCurrentAccount.mockResolvedValue({ email: 'ana@example.com' });
    journeyApi.fetchJourney.mockResolvedValue(A_JOURNEY);

    expect(await visit('/login')).toBe('/scene');
  });

  it('keeps the planner closed once a journey is planned', async () => {
    api.fetchCurrentAccount.mockResolvedValue({ email: 'ana@example.com' });
    journeyApi.fetchJourney.mockResolvedValue(A_JOURNEY);

    expect(await visit('/start')).toBe('/scene');
  });

  it('opens the planner to change a planned journey from the settings', async () => {
    api.fetchCurrentAccount.mockResolvedValue({ email: 'ana@example.com' });
    journeyApi.fetchJourney.mockResolvedValue(A_JOURNEY);

    expect(await visit('/start?change')).toBe('/start?change');
  });

  it('shows the sign-in screen to a signed-out visitor', async () => {
    expect(await visit('/login')).toBe('/login');
  });
});
