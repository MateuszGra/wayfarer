import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SceneHud from './SceneHud.vue';

const hud = (props: Partial<InstanceType<typeof SceneHud>['$props']> = {}) =>
  mount(SceneHud, {
    props: { routeId: 'baltic-santiago', doneKm: 214, totalKm: 3200, day: 12, status: 'walking', ...props },
  });

describe('SceneHud', () => {
  it('shows the route name in Polish', () => {
    expect(hud().get('[data-testid="hud-route"]').text()).toBe('Bałtyk → Santiago de Compostela');
  });

  it('shows the distance with a decimal comma', () => {
    expect(hud({ doneKm: 214.25 }).get('[data-testid="hud-distance"]').text()).toBe('214,3 z 3200 km');
  });

  it.each([
    { status: 'walking', text: 'Dzień 12 · Wędruje' },
    { status: 'sleeping', text: 'Dzień 12 · Śpi w namiocie' },
  ] as const)('describes the wanderer as "$text" when $status', ({ status, text }) => {
    expect(hud({ status }).get('[data-testid="hud-details"]').text()).toBe(text);
  });
});
