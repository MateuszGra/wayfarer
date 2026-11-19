import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DevPanel from './DevPanel.vue';

const panel = (props: Partial<InstanceType<typeof DevPanel>['$props']> = {}) =>
  mount(DevPanel, {
    props: {
      hour: 18.5,
      playing: false,
      dayLengthMinutes: 2,
      biome: 'baltic',
      biomeIds: ['baltic', 'meseta'],
      beardDay: 12,
      collapsed: false,
      ...props,
    },
  });

describe('DevPanel', () => {
  it('shows the current time next to the slider', () => {
    expect(panel({ hour: 6.25 }).text()).toContain('Pora dnia · 06:15');
  });

  it('emits the new hour when the slider moves', async () => {
    const wrapper = panel();

    await wrapper.get('[data-testid="dev-hour"]').setValue('21.5');

    expect(wrapper.emitted('update:hour')).toEqual([[21.5]]);
  });

  it('shows the beard as days on the road and emits the chosen day', async () => {
    const wrapper = panel({ beardDay: 12 });

    await wrapper.get('[data-testid="dev-beard"]').setValue('45');

    expect(wrapper.text()).toContain('Broda · 12 dni w drodze');
    expect(wrapper.emitted('update:beardDay')).toEqual([[45]]);
  });

  it('says when the beard is full', () => {
    expect(panel({ beardDay: 60 }).text()).toContain('Broda · 60 dni w drodze (pełna)');
  });

  it('takes its controls out of reach when collapsed, leaving the tab to show it', () => {
    const wrapper = panel({ collapsed: true });

    expect(wrapper.get('#dev-panel-body').attributes('inert')).toBeDefined();
    expect(wrapper.get('[data-testid="dev-toggle"]').attributes('aria-label')).toBe('Pokaż panel deweloperski');
  });

  it('asks to collapse from its header', async () => {
    const wrapper = panel();

    await wrapper.get('[data-testid="dev-toggle"]').trigger('click');

    expect(wrapper.emitted('update:collapsed')).toEqual([[true]]);
  });

  it('offers to stop time while it is running', () => {
    expect(panel({ playing: true }).get('[data-testid="dev-play"]').text()).toBe('Zatrzymaj czas');
  });

  it('lists every biome by its Polish name and emits the chosen one', async () => {
    const wrapper = panel();

    await wrapper.get('[data-testid="dev-biome-meseta"]').trigger('click');

    expect(wrapper.get('[data-testid="dev-biome-baltic"]').text()).toBe('Bałtyk');
    expect(wrapper.emitted('select-biome')).toEqual([['meseta']]);
  });
});
