import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AchievementDay from './AchievementDay.vue';

const day = (props: Partial<InstanceType<typeof AchievementDay>['$props']> = {}) =>
  mount(AchievementDay, {
    props: { day: 6, date: '2026-11-13', steps: 11_240, goal: 10_000, outcome: 'reached', ...props },
  });

describe('AchievementDay', () => {
  it('shows the day, its date, the steps and the distance', () => {
    const text = day().text();

    expect(text).toContain('Dzień 6');
    expect(text).toContain('13 listopada');
    expect(text).toContain('11 240 kroków');
    expect(text).toContain('8,4 km');
  });

  it('marks a day with the goal reached', () => {
    expect(day().get('[data-testid="day-outcome"]').text()).toBe('Cel osiągnięty');
  });

  it('encourages on a missed day with the share of the goal walked', () => {
    expect(day({ steps: 8_120, outcome: 'missed' }).get('[data-testid="day-outcome"]').text()).toBe('81% celu');
  });

  it('marks a rest day as a rest', () => {
    expect(day({ steps: 0, outcome: 'rest' }).get('[data-testid="day-outcome"]').text()).toBe('Odpoczynek');
  });
});
