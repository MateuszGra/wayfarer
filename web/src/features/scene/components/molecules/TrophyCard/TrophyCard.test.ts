import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TrophyCard from './TrophyCard.vue';

describe('TrophyCard', () => {
  it('names a won trophy and says it is won', () => {
    const wrapper = mount(TrophyCard, { props: { trophy: { id: 'aezakmi', goal: 20_000, done: 20_000, won: true } } });

    expect(wrapper.get('h4').text()).toBe('AEZAKMI');
    expect(wrapper.text()).toContain('Zdobyty!');
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false);
  });

  it('shows how far a trophy still to win is, in steps', () => {
    const wrapper = mount(TrophyCard, {
      props: { trophy: { id: 'kremowka', goal: 213_700, done: 103_922, won: false } },
    });

    // Polish number format separates thousands with a no-break space.
    expect(wrapper.text()).toContain('103\u00a0922 z 213\u00a0700 kroków');
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('103922');
    expect(wrapper.text()).not.toContain('Zdobyty!');
  });

  it('fills the bar by the share of the goal walked', () => {
    const wrapper = mount(TrophyCard, {
      props: { trophy: { id: 'dragonborn', goal: 70_000, done: 35_000, won: false } },
    });

    expect(wrapper.get('.trophy-card__fill').attributes('style')).toBe('width: 50%;');
  });
});
