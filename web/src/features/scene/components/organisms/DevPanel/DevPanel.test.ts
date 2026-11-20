import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import DevPanel from './DevPanel.vue';

const CLEAR = { sky: 'clear', precipitation: 'none', storm: false, wind: 'breeze', frost: false } as const;

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
      weather: CLEAR,
      weatherFromApi: true,
      ...props,
    },
  });

// Which sections are open is remembered in the browser; every test starts with nothing remembered.
beforeEach(() => {
  localStorage.clear();
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

  it('shows the latest weather reading from the API', async () => {
    const wrapper = panel({
      apiWeather: {
        region: 'Słupsk',
        weather: { sky: 'overcast', precipitation: 'rain', storm: false, wind: 'breeze', frost: false },
        temperatureC: 4.6,
        windKmh: 16.6,
        observedAt: '2026-11-20T13:15:00.000Z',
      },
    });

    await wrapper.get('[data-testid="dev-weather"] button').trigger('click');

    expect(wrapper.get('[data-testid="dev-weather-api"]').text()).toBe(
      'Z API: Słupsk · 4,6 °C · 17 km/h · Pochmurno, Deszcz',
    );
  });

  it('sets the weather by hand, one layer at a time', async () => {
    const wrapper = panel();
    await wrapper.get('[data-testid="dev-weather"] button').trigger('click');

    await wrapper.get('[data-testid="dev-fall-heavySnow"]').trigger('click');

    expect(wrapper.emitted('update:weather')).toEqual([[{ ...CLEAR, precipitation: 'heavySnow' }]]);
  });

  it('switches a storm on', async () => {
    const wrapper = panel();
    await wrapper.get('[data-testid="dev-weather"] button').trigger('click');

    await wrapper.get('[data-testid="dev-storm"]').trigger('click');

    expect(wrapper.emitted('update:weather')).toEqual([[{ ...CLEAR, storm: true }]]);
  });

  it('goes back to the weather from the API', async () => {
    const wrapper = panel({ weatherFromApi: false });
    await wrapper.get('[data-testid="dev-weather"] button').trigger('click');

    await wrapper.get('[data-testid="dev-weather-from-api"]').trigger('click');

    expect(wrapper.emitted('follow-api-weather')).toEqual([[]]);
  });

  it("swaps today's walk for a whole day on the road", async () => {
    const wrapper = panel();

    await wrapper.get('[data-testid="dev-walk-fullDay"]').trigger('click');

    expect(wrapper.emitted('update:walkMode')).toEqual([['fullDay']]);
  });

  it('marks the walk the scene shows', () => {
    const wrapper = panel({ walkMode: 'camp' });

    expect(wrapper.get('[data-testid="dev-walk-camp"]').classes()).toContain('base-button--primary');
  });

  it('goes back to the landscape of the route', async () => {
    const wrapper = panel({ placeFromRoute: false });

    await wrapper.get('[data-testid="dev-follow-route"]').trigger('click');

    expect(wrapper.emitted('follow-route')).toEqual([[]]);
  });

  it('shows where on the route today starts', () => {
    const wrapper = panel({ routePlace: { region: 'lowerVistula', km: 123.4 } });

    expect(wrapper.get('[data-testid="dev-route-place"]').text()).toBe('Trasa: lowerVistula, 123 km');
  });

  it('keeps him to tea by the fire', async () => {
    const wrapper = panel();

    await wrapper.get('[data-testid="dev-camp-tea"]').trigger('click');

    expect(wrapper.emitted('update:campHabit')).toEqual([['tea']]);
  });
});
