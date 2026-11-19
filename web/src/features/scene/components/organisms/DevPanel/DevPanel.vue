<script setup lang="ts">
import { computed } from 'vue';
import { BaseButton, BasePanel } from '@/design-system';
import { FULL_BEARD_DAYS } from '@shared/wanderer/beard';
import { t, tn, type TranslationKey } from '@/shared/i18n';

export interface Props {
  hour: number;
  playing: boolean;
  dayLengthMinutes: number;
  biome: string;
  biomeIds: readonly string[];
  /** Day on the road the beard is shown for; it is full from FULL_BEARD_DAYS on. */
  beardDay: number;
  collapsed: boolean;
}

defineOptions({ name: 'DevPanel' });
const props = defineProps<Props>();
const emit = defineEmits<{
  'update:hour': [hour: number];
  'update:collapsed': [collapsed: boolean];
  'update:beardDay': [day: number];
  'toggle-play': [];
  now: [];
  'cycle-day-length': [];
  'select-biome': [id: string];
  reseed: [];
}>();

const clock = computed(() => {
  const h = Math.floor(props.hour);
  const m = Math.floor((props.hour - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});
const biomeLabel = (id: string): string => t(`biome.${id}` as TranslationKey);
const beardLabel = computed(() =>
  t(props.beardDay >= FULL_BEARD_DAYS ? 'dev.beardFull' : 'dev.beard', { days: tn('unit.days', props.beardDay) }),
);
const sliderValue = (event: Event): number => Number((event.target as HTMLInputElement).value);
</script>

<template>
  <aside class="dev-panel" :class="{ 'dev-panel--collapsed': collapsed }" :aria-label="t('dev.title')">
    <!-- When collapsed the panel slides off the right edge; only this tab stays on screen to pull it back. -->
    <button
      type="button"
      class="dev-panel__tab"
      :aria-label="collapsed ? t('dev.show') : t('dev.hide')"
      :aria-expanded="!collapsed"
      aria-controls="dev-panel-body"
      data-testid="dev-toggle"
      @click="emit('update:collapsed', !collapsed)"
    >
      <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
        <path
          :d="collapsed ? 'M12 4l-6 6 6 6' : 'M8 4l6 6-6 6'"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <BasePanel id="dev-panel-body" class="dev-panel__body" :inert="collapsed">
      <p class="dev-panel__title">{{ t('dev.title') }}</p>
      <section class="dev-panel__group">
        <label class="dev-panel__label" for="dev-hour">{{ t('dev.time') }} · {{ clock }}</label>
        <input
          id="dev-hour"
          class="dev-panel__slider"
          type="range"
          min="0"
          max="23.99"
          step="0.01"
          :value="hour"
          data-testid="dev-hour"
          @input="emit('update:hour', sliderValue($event))"
        />
        <div class="dev-panel__row">
          <BaseButton
            size="sm"
            :variant="playing ? 'primary' : 'ghost'"
            data-testid="dev-play"
            @click="emit('toggle-play')"
          >
            {{ playing ? t('dev.pause') : t('dev.play') }}
          </BaseButton>
          <BaseButton size="sm" data-testid="dev-now" @click="emit('now')">{{ t('dev.now') }}</BaseButton>
        </div>
        <BaseButton size="sm" data-testid="dev-day-length" @click="emit('cycle-day-length')">
          {{ t('dev.dayLength', { minutes: dayLengthMinutes }) }}
        </BaseButton>
      </section>

      <section class="dev-panel__group">
        <label class="dev-panel__label" for="dev-beard">{{ beardLabel }}</label>
        <input
          id="dev-beard"
          class="dev-panel__slider"
          type="range"
          min="1"
          :max="FULL_BEARD_DAYS + 20"
          step="1"
          :value="beardDay"
          data-testid="dev-beard"
          @input="emit('update:beardDay', sliderValue($event))"
        />
      </section>

      <section class="dev-panel__group">
        <p class="dev-panel__label">{{ t('dev.place') }}</p>
        <div class="dev-panel__row">
          <BaseButton
            v-for="id in biomeIds"
            :key="id"
            size="sm"
            :variant="id === biome ? 'primary' : 'ghost'"
            :data-testid="`dev-biome-${id}`"
            @click="emit('select-biome', id)"
          >
            {{ biomeLabel(id) }}
          </BaseButton>
        </div>
        <BaseButton size="sm" data-testid="dev-reseed" @click="emit('reseed')">{{ t('dev.reseed') }}</BaseButton>
      </section>
    </BasePanel>
  </aside>
</template>

<style scoped>
.dev-panel {
  position: absolute;
  top: max(var(--space-4), env(safe-area-inset-top));
  right: var(--gutter);
  width: min(300px, calc(100vw - 2 * var(--space-4) - 32px));
  transition: transform 0.25s ease;
}
.dev-panel--collapsed {
  transform: translateX(calc(100% + var(--gutter)));
}
.dev-panel__tab {
  position: absolute;
  top: var(--space-3);
  left: -30px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 44px;
  padding: 0;
  color: var(--fg);
  background: var(--glass-strong);
  border: 1px solid var(--line);
  border-right: 0;
  border-radius: 10px 0 0 10px;
  backdrop-filter: blur(10px);
  cursor: pointer;
}
.dev-panel__body {
  display: grid;
  gap: var(--space-4);
}
.dev-panel__title {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--fg-dim);
}
.dev-panel__group {
  display: grid;
  gap: var(--space-2);
}
.dev-panel__label {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--fg-dim);
  font-variant-numeric: tabular-nums;
}
.dev-panel__slider {
  width: 100%;
  accent-color: var(--accent);
}
.dev-panel__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
