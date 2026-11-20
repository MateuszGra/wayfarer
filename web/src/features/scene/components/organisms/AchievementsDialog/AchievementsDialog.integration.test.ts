import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';
import AchievementsDialog from './AchievementsDialog.vue';

// Steps come from the player's journey, our own composable: two days adding up to exactly 70 000 steps,
// the second one entered today and still open to correction.
vi.mock('@/shared/composables/useJourney', () => ({
  useJourney: () => ({
    journey: computed(() => ({
      journey: {
        routeId: 'baltic-santiago',
        dailySteps: 10_000,
        timeZone: 'Europe/Warsaw',
        startedOn: '2026-11-19',
        routeSinceKm: 0,
      },
      today: {
        date: '2026-11-20',
        day: 2,
        stepsDate: '2026-11-19',
        stepsEntered: 40_000,
        walk: null,
        kmAtDayStart: 22.5,
        kmToday: 30,
        history: [
          { day: 1, date: '2026-11-18', steps: 30_000 },
          { day: 2, date: '2026-11-19', steps: 40_000 },
        ],
      },
    })),
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

    expect(query('[data-testid="trophies-count"]')?.textContent?.trim()).toBe('Zdobyte: 2 z 7');
  });

  it('marks a trophy whose goal equals the steps walked as won', async () => {
    await openAchievements();

    await showTrophies();

    expect(query('[data-testid="trophy-dragonborn"]')?.textContent).toContain('Zdobyty!');
    expect(query('[data-testid="trophy-kremowka"]')?.textContent).not.toContain('Zdobyty!');
  });

  it('offers to correct the steps entered today', async () => {
    const wrapper = mount(AchievementsDialog, { props: { open: true }, attachTo: document.body });
    await flushPromises();

    query('[data-testid="correct-steps"]')?.click();

    expect(wrapper.emitted('correct-steps')).toEqual([[]]);
  });
});
