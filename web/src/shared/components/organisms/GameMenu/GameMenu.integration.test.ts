import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import type { MenuEntry } from '@/shared/composables/useGameMenu';
import GameMenu from './GameMenu.vue';

const entries: readonly MenuEntry[] = [
  { id: 'map', label: 'menu.map' },
  { id: 'achievements', label: 'menu.achievements' },
];
const query = (testId: string) => document.body.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

// The dialog renders into a portal on the next ticks, so wait for it before looking at the page.
async function openMenu(open = true) {
  const wrapper = mount(GameMenu, { props: { open, entries }, attachTo: document.body });
  await flushPromises();
  return wrapper;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('GameMenu', () => {
  it('lists the entries with sign-out as the very last option', async () => {
    await openMenu();

    const labels = [...document.body.querySelectorAll('nav button')].map((button) => button.textContent?.trim());

    expect(labels).toEqual(['Mapa', 'Osiągnięcia', 'Wyloguj się']);
  });

  it('reports the chosen entry', async () => {
    const wrapper = await openMenu();

    query('menu-map')?.click();

    expect(wrapper.emitted('select')).toEqual([['map']]);
  });

  it('asks to sign out', async () => {
    const wrapper = await openMenu();

    query('menu-logout')?.click();

    expect(wrapper.emitted('logout')).toHaveLength(1);
  });

  it('shows nothing while closed', async () => {
    await openMenu(false);

    expect(query('menu-logout')).toBeNull();
  });
});
