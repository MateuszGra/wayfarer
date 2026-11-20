import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import BaseTabs from './BaseTabs.vue';

const tabs = [
  { value: 'journal', label: 'Dziennik' },
  { value: 'trophies', label: 'Puchary' },
] as const;
const slots = { journal: '<p>Lista dni</p>', trophies: '<p>Lista pucharów</p>' };
const mountTabs = (modelValue: 'journal' | 'trophies' = 'journal') =>
  mount(BaseTabs, { props: { modelValue, tabs, label: 'Rodzaje' }, slots, attachTo: document.body });

describe('BaseTabs', () => {
  it('shows only the panel of the chosen tab', () => {
    const wrapper = mountTabs();

    expect(wrapper.text()).toContain('Lista dni');
    expect(wrapper.text()).not.toContain('Lista pucharów');
    wrapper.unmount();
  });

  it('asks to switch when another tab is pressed', async () => {
    const wrapper = mountTabs();

    await wrapper.get('[data-testid="tab-trophies"]').trigger('mousedown', { button: 0 });

    expect(wrapper.emitted('update:modelValue')).toEqual([['trophies']]);
    wrapper.unmount();
  });

  it('marks the chosen tab as selected for assistive technology', () => {
    const wrapper = mountTabs('trophies');

    expect(wrapper.get('[data-testid="tab-trophies"]').attributes('aria-selected')).toBe('true');
    expect(wrapper.get('[data-testid="tab-journal"]').attributes('aria-selected')).toBe('false');
    wrapper.unmount();
  });
});
