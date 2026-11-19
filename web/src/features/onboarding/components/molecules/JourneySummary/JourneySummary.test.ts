import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import JourneySummary from './JourneySummary.vue';

const START = new Date(2026, 10, 20);
const summary = (lengthKm: number, dailySteps: number) =>
  mount(JourneySummary, { props: { lengthKm, dailySteps, startDate: START } });
const line = (wrapper: ReturnType<typeof summary>, id: string) => wrapper.get(`[data-testid="summary-${id}"]`).text();

describe('JourneySummary', () => {
  it('shows the daily distance for the step goal', () => {
    expect(line(summary(3200, 10_000), 'daily')).toBe('Dziennie ok. 7,5 km');
  });

  it('gives a long journey in days and months', () => {
    expect(line(summary(3200, 10_000), 'duration')).toBe('Cała trasa: 427 dni (ok. 14 miesięcy)');
  });

  it('gives a short journey in days only', () => {
    expect(line(summary(100, 10_000), 'duration')).toBe('Cała trasa: 14 dni');
  });

  it('shows the month of arrival', () => {
    expect(line(summary(3200, 10_000), 'arrival')).toBe('Na miejscu: styczeń 2028');
  });

  it('shortens the journey when the goal goes up', () => {
    expect(line(summary(3200, 20_000), 'duration')).toBe('Cała trasa: 214 dni (ok. 7 miesięcy)');
  });
});
