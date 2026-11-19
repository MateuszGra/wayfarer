import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SceneHud from './SceneHud.vue';

const hud = (props: Partial<InstanceType<typeof SceneHud>['$props']> = {}) =>
  mount(SceneHud, { props: { routeId: 'baltic-santiago', doneKm: 214, totalKm: 3200, hour: 18.5, ...props } });

describe('SceneHud', () => {
  it('shows the route name in Polish', () => {
    expect(hud().get('[data-testid="hud-route"]').text()).toBe('Bałtyk → Santiago de Compostela');
  });

  it('shows the distance with a decimal comma', () => {
    expect(hud({ doneKm: 214.25 }).get('[data-testid="hud-distance"]').text()).toBe('214,3 z 3200 km');
  });

  it.each([
    { hour: 0, clock: '00:00' },
    { hour: 6.5, clock: '06:30' },
    { hour: 23.99, clock: '23:59' },
  ])('shows $clock for hour $hour', ({ hour, clock }) => {
    expect(hud({ hour }).get('[data-testid="hud-clock"]').text()).toBe(clock);
  });
});
