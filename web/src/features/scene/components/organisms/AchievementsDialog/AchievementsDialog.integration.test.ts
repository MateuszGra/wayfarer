import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';
import { forgetWorldEventsForTests } from '@/shared/composables/useWorldEvents';
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

// The network boundary for moments seen in the world: Bigfoot seen once, the angler not yet.
vi.mock('@/shared/api/achievements', () => ({
  fetchWorldEvents: async () => ({ seen: [{ id: 'bigfootSeen', seenAt: '2026-11-19T19:30:00.000Z' }] }),
  recordWorldEvent: async () => ({ seen: [] }),
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
  forgetWorldEventsForTests();
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

  it('counts the trophies won on the road and in the world', async () => {
    await openAchievements();

    await showTrophies();

    expect(query('[data-testid="trophies-count"]')?.textContent?.trim()).toBe('Zdobyte: 3 z 14');
  });

  it('lists the moments seen in the world apart, marking the one already seen', async () => {
    await openAchievements();

    await showTrophies();

    const world = query('[data-testid="world-trophies"]');
    expect(world?.querySelector('[data-testid="trophy-bigfootSeen"]')?.textContent).toContain('Zdobyty!');
    expect(world?.querySelector('[data-testid="trophy-pikeCaught"]')?.textContent).toContain('Jeszcze nie widziane.');
  });

  it('counts the days in a row with the goal reached towards the ten-out-of-ten trophy', async () => {
    await openAchievements();

    await showTrophies();

    expect(query('[data-testid="trophy-tenOutOfTen"]')?.textContent).toContain('2 z 10 dni z rzędu');
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

  it('opens straight on the trophies when asked to, after a trophy is won', async () => {
    mount(AchievementsDialog, { props: { open: true, startTab: 'trophies' }, attachTo: document.body });
    await flushPromises();

    expect(query('[data-testid="trophies-count"]')).not.toBeNull();
  });

  it('puts the won trophies at the top of the list', async () => {
    await openAchievements();

    await showTrophies();

    const names = [
      ...document.body.querySelectorAll('[aria-label="Puchary do zdobycia"] [data-testid^="trophy-"]'),
    ].map((card) => card.getAttribute('data-testid'));
    expect(names.slice(0, 2)).toEqual(['trophy-aezakmi', 'trophy-dragonborn']);
    expect(names[2]).toBe('trophy-tenOutOfTen');
  });
});
