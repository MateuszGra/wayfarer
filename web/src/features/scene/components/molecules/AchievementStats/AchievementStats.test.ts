import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AchievementStats from './AchievementStats.vue';

describe('AchievementStats', () => {
  it('shows the days, goals reached, total steps and distance', () => {
    const wrapper = mount(AchievementStats, {
      props: { summary: { days: 11, goalsReached: 7, totalSteps: 103_922, totalKm: 77.94 } },
    });

    expect(wrapper.get('[data-testid="stats-days"]').text()).toBe('11');
    expect(wrapper.get('[data-testid="stats-goals"]').text()).toBe('7 z 11');
    expect(wrapper.get('[data-testid="stats-steps"]').text()).toBe('103 922');
    expect(wrapper.get('[data-testid="stats-km"]').text()).toBe('77,9');
  });
});
