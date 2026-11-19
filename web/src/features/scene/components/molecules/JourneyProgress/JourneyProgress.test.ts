import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import JourneyProgress from './JourneyProgress.vue';

const panel = (doneKm: number, dailySteps = 10_000) =>
  mount(JourneyProgress, { props: { routeId: 'baltic-santiago', lengthKm: 3200, doneKm, dailySteps } });
const line = (wrapper: ReturnType<typeof panel>, id: string) => wrapper.get(`[data-testid="${id}"]`).text();

describe('JourneyProgress', () => {
  it('shows the distance walked and the share of the route', () => {
    expect(line(panel(214), 'progress-summary')).toBe('214 z 3200 km · 6%');
  });

  it('shows what is left', () => {
    expect(line(panel(214), 'progress-left')).toBe('Zostało 2986 km');
  });

  it('estimates the rest of the journey at the step goal', () => {
    expect(line(panel(214), 'progress-at-goal')).toBe('Przy celu 10 000 kroków: 399 dni');
  });

  it('stops estimating once the destination is reached', () => {
    const wrapper = panel(3200);

    expect(line(wrapper, 'progress-summary')).toBe('3200 z 3200 km · 100%');
    expect(wrapper.find('[data-testid="progress-at-goal"]').exists()).toBe(false);
  });
});
