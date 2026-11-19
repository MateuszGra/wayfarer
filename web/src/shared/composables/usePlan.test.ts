import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { DEFAULT_DAILY_STEPS, usePlan } from './usePlan';

function mountPlan() {
  let plan!: ReturnType<typeof usePlan>;
  mount(defineComponent({ setup: () => ((plan = usePlan()), () => h('div')) }));
  return plan;
}

afterEach(() => localStorage.clear());

describe('usePlan', () => {
  it('starts with no route and the default goal', () => {
    const plan = mountPlan();

    expect(plan.routeId.value).toBeNull();
    expect(plan.dailySteps.value).toBe(DEFAULT_DAILY_STEPS);
  });

  it('remembers the chosen plan for the next visit', async () => {
    const first = mountPlan();
    first.routeId.value = 'baltic-santiago';
    first.dailySteps.value = 14_000;
    await nextTick();

    const next = mountPlan();

    expect(next.routeId.value).toBe('baltic-santiago');
    expect(next.dailySteps.value).toBe(14_000);
  });

  it('falls back to defaults when the stored plan is unreadable', () => {
    localStorage.setItem('wayfarer.plan', '{not json');

    expect(mountPlan().dailySteps.value).toBe(DEFAULT_DAILY_STEPS);
  });
});
