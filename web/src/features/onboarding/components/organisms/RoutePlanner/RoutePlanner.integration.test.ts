import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RoutePlanner from './RoutePlanner.vue';

const route = {
  id: 'baltic-santiago',
  lengthKm: 3200,
  path: [
    [18.6, 54.3],
    [-8.5, 42.9],
  ] as const,
};
const planner = (props: Partial<InstanceType<typeof RoutePlanner>['$props']> = {}) =>
  mount(RoutePlanner, {
    props: {
      routes: [route],
      routeId: 'baltic-santiago',
      dailySteps: 10_000,
      startDate: new Date(2026, 10, 20),
      ...props,
    },
  });

describe('RoutePlanner', () => {
  it('shows the route with its length', () => {
    expect(planner().get('[data-testid="route-baltic-santiago"]').text()).toBe(
      'Bałtyk → Santiago de Compostela3200 km',
    );
  });

  it('shows the step goal and how long the journey takes with it', () => {
    const wrapper = planner({ dailySteps: 12_500 });

    expect(wrapper.get('[data-testid="step-goal-value"]').text()).toBe('12 500 kroków');
    expect(wrapper.get('[data-testid="summary-duration"]').text()).toBe('Cała trasa: 342 dni (ok. 11 miesięcy)');
  });

  it('selects a route when it is clicked', async () => {
    const wrapper = planner({ routeId: null });

    await wrapper.get('[data-testid="route-baltic-santiago"]').trigger('click');

    expect(wrapper.emitted('update:routeId')).toEqual([['baltic-santiago']]);
  });

  it('cannot continue before a route is chosen', () => {
    const wrapper = planner({ routeId: null });

    expect(wrapper.get('[data-testid="plan-continue"]').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-testid="summary-duration"]').exists()).toBe(false);
  });

  it('continues with the chosen plan', async () => {
    const wrapper = planner();

    await wrapper.get('[data-testid="plan-continue"]').trigger('click');

    expect(wrapper.emitted('continue')).toHaveLength(1);
  });

  it('offers no way back on the first plan', () => {
    expect(planner().find('[data-testid="plan-back"]').exists()).toBe(false);
  });

  it('offers a way back when changing a planned journey', async () => {
    const wrapper = planner({ changing: true });

    await wrapper.get('[data-testid="plan-back"]').trigger('click');

    expect(wrapper.emitted('back')).toEqual([[]]);
  });
});
