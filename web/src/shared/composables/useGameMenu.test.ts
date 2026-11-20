import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { useGameMenu, type GameOverlay } from './useGameMenu';

const api = vi.hoisted(() => ({ logout: vi.fn<() => Promise<void>>(), fetchCurrentAccount: vi.fn() }));
vi.mock('@/shared/api/auth', () => api);

function mountMenu(initial: GameOverlay | null = null) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:any(.*)*', component: { render: () => null } }],
  });
  let menu!: ReturnType<typeof useGameMenu>;
  const wrapper = mount(defineComponent({ setup: () => ((menu = useGameMenu(initial)), () => h('div')) }), {
    global: { plugins: [router] },
  });
  return { menu, wrapper, router };
}
const pressEscape = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

describe('useGameMenu', () => {
  it('opens the menu on Escape when nothing is open', () => {
    const { menu } = mountMenu();

    pressEscape();

    expect(menu.overlay.value).toBe('menu');
  });

  it.each(['menu', 'map'] as const)('closes the open %s on Escape', (open) => {
    const { menu } = mountMenu(open);

    pressEscape();

    expect(menu.overlay.value).toBeNull();
  });

  it('opens the map in place of the menu when it is chosen', () => {
    const { menu } = mountMenu('menu');

    menu.select('map');

    expect(menu.overlay.value).toBe('map');
  });

  it('returns from a window to the menu it was opened from', () => {
    const { menu } = mountMenu('settings');

    menu.back();

    expect(menu.overlay.value).toBe('menu');
  });

  it('signs out on the server, closes everything and goes to the sign-in screen', async () => {
    api.logout.mockResolvedValue(undefined);
    const { menu, router } = mountMenu('menu');

    await menu.logout();

    expect(api.logout).toHaveBeenCalledTimes(1);
    expect(menu.overlay.value).toBeNull();
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('still goes to the sign-in screen when the server cannot be told about the sign-out', async () => {
    api.logout.mockRejectedValue(new Error('offline'));
    const { menu, router } = mountMenu('menu');

    await menu.logout();

    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('stops listening to Escape once unmounted', () => {
    const { menu, wrapper } = mountMenu();

    wrapper.unmount();
    pressEscape();

    expect(menu.overlay.value).toBeNull();
  });
});
