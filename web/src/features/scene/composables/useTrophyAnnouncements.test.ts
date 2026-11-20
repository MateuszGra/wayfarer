import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import type { TrophyProgress } from '@shared/achievements/trophies';
import { useTrophyAnnouncements } from './useTrophyAnnouncements';

const trophy = (id: TrophyProgress['id'], won: boolean): TrophyProgress => ({
  id,
  measure: 'steps',
  goal: 1,
  done: won ? 1 : 0,
  won,
});

describe('useTrophyAnnouncements', () => {
  it('announces nothing the player had already won when the game opened', async () => {
    const trophies = ref([trophy('aezakmi', true)]);
    const { current } = useTrophyAnnouncements(trophies, ref(true));
    await nextTick();

    expect(current.value).toBeNull();
  });

  it('announces a trophy won while the game is open', async () => {
    const trophies = ref([trophy('aezakmi', false)]);
    const { current } = useTrophyAnnouncements(trophies, ref(true));

    trophies.value = [trophy('aezakmi', true)];
    await nextTick();

    expect(current.value?.id).toBe('aezakmi');
  });

  it('waits for the player data before deciding what was already won', async () => {
    const trophies = ref<TrophyProgress[]>([]);
    const ready = ref(false);
    const { current } = useTrophyAnnouncements(trophies, ready);

    trophies.value = [trophy('aezakmi', true)];
    ready.value = true;
    await nextTick();

    expect(current.value).toBeNull();
  });

  it('announces two trophies won together one after the other', async () => {
    const trophies = ref([trophy('aezakmi', false), trophy('dragonborn', false)]);
    const { current, dismiss } = useTrophyAnnouncements(trophies, ref(true));
    trophies.value = [trophy('aezakmi', true), trophy('dragonborn', true)];
    await nextTick();
    const first = current.value?.id;

    dismiss();

    expect(first).toBe('aezakmi');
    expect(current.value?.id).toBe('dragonborn');
  });
});
