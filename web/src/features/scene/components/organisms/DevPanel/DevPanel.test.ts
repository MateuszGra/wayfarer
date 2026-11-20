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
      level: 'mid',
      levels: ['low', 'mid', 'high'],
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

  it('offers the height levels of a mountain biome and emits the chosen one', async () => {
    const wrapper = panel();

    await wrapper.get('[data-testid="dev-level-high"]').trigger('click');

    expect(wrapper.get('[data-testid="dev-level-low"]').text()).toBe('Niska');
    expect(wrapper.emitted('select-level')).toEqual([['high']]);
  });

  it('hides the height switch for a biome with a single level', () => {
    expect(
      panel({ levels: ['mid'] })
        .find('[data-testid="dev-level-mid"]')
        .exists(),
    ).toBe(false);
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

  it('lists the biome behaviours by group once the behaviours section is opened', async () => {
    const wrapper = panel({
      behaviours: [
        { id: 'drink', group: 'wanderer' },
        { id: 'catWash', group: 'cat' },
        { id: 'birdRobin', group: 'bird' },
      ],
    });

    await wrapper.get('[data-testid="dev-behaviours"] button').trigger('click');

    expect(wrapper.text()).toContain('Wędrowiec');
    expect(wrapper.text()).toContain('Pije z bukłaka');
    expect(wrapper.text()).toContain('Myje łapkę');
    expect(wrapper.text()).toContain('Ptak przylatuje');
    expect(wrapper.text()).toContain('Rudzik');
  });

  it('emits the behaviour to start when its button is pressed', async () => {
    const wrapper = panel({ behaviours: [{ id: 'catRide', group: 'cat' }] });
    await wrapper.get('[data-testid="dev-behaviours"] button').trigger('click');

    await wrapper.get('[data-testid="dev-behaviour-catRide"]').trigger('click');

    expect(wrapper.emitted('trigger')).toEqual([['catRide']]);
  });

  it('says nothing can be started when no behaviour is available at the moment', async () => {
    const wrapper = panel({ behaviours: [] });

    await wrapper.get('[data-testid="dev-behaviours"] button').trigger('click');

    expect(wrapper.get('[data-testid="dev-behaviours-none"]').text()).toBe('W tej chwili nic nie da się wywołać.');
  });
});
