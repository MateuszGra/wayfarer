import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';
import AchievementsDialog from './AchievementsDialog.vue';

// Steps come from our own history composable; two days adding up to exactly 70 000 steps.
vi.mock('@/shared/composables/useStepHistory', () => ({
  useStepHistory: () => ({
    history: computed(() => [
      { day: 1, date: '2026-11-18', steps: 30_000 },
      { day: 2, date: '2026-11-19', steps: 40_000 },
    ]),
  }),
}));

// The dialog renders through a portal, so it is queried on the document rather than the wrapper.
const query = (selector: string) => document.body.querySelector<HTMLElement>(selector);

async function openAchievements() {
  mount(AchievementsDialog, { props: { open: true }, attachTo: document.body });
  await flushPromises();
}
async function showTrophies() {
  query('[data-testid="tab-trophies"]')?.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
  await flushPromises();
}

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  document.body.innerHTML = '';
});

describe('AchievementsDialog', () => {
  it('opens on the journal of days', async () => {
    await openAchievements();

    expect(query('[aria-label="Dni wędrówki"]')?.querySelectorAll('li')).toHaveLength(2);
    expect(query('[data-testid="trophies-count"]')).toBeNull();
  });

  it('counts the trophies won by the steps walked so far', async () => {
    await openAchievements();

    await showTrophies();

    expect(query('[data-testid="trophies-count"]')?.textContent?.trim()).toBe('Zdobyte: 3 z 7');
  });

  it('marks a trophy whose goal equals the steps walked as won', async () => {
    await openAchievements();

    await showTrophies();

    expect(query('[data-testid="trophy-postalVote"]')?.textContent).toContain('Zdobyty!');
    expect(query('[data-testid="trophy-kremowka"]')?.textContent).not.toContain('Zdobyty!');
  });
});
