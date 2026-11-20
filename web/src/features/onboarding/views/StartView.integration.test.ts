import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import StartView from './StartView.vue';

// The network boundary: our own API module, replaced so no request leaves the test.
const api = vi.hoisted(() => ({
  fetchRoutes: vi.fn(async () => [{ id: 'baltic-santiago', lengthKm: 3200, path: [] }]),
}));
vi.mock('@/shared/api/routes', () => api);

async function openPlanner(url: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/start', component: StartView },
      { path: '/scene', component: { render: () => null } },
    ],
  });
  await router.push(url);
  const wrapper = mount(StartView, {
    global: { plugins: [router], stubs: { RouteMap: true } },
  });
  await flushPromises();
  return { wrapper, router };
}

beforeEach(() => {
  api.fetchRoutes.mockClear();
  // jsdom has no media queries; the planner is laid out as on a phone.
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('StartView', () => {
  it('offers no way back on the first plan', async () => {
    const { wrapper } = await openPlanner('/start');

    expect(wrapper.find('[data-testid="plan-back"]').exists()).toBe(false);
  });

  it('takes the player back to the game when changing a planned journey', async () => {
    const { wrapper, router } = await openPlanner('/start?change');

    await wrapper.get('[data-testid="plan-back"]').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/scene');
  });
});
