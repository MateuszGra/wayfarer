<script setup lang="ts">
import { computed } from 'vue';
import { BaseDialog } from '@/design-system';
import RouteMap from '@/shared/components/organisms/RouteMap/RouteMap.vue';
import { useJourney } from '@/shared/composables/useJourney';
import { useRoutes } from '@/shared/composables/useRoutes';
import { t } from '@/shared/i18n';
import JourneyProgress from '../../molecules/JourneyProgress/JourneyProgress.vue';

export interface Props {
  open: boolean;
}

defineOptions({ name: 'MapDialog' });
defineProps<Props>();
const emit = defineEmits<{ 'update:open': [open: boolean]; back: [] }>();

const { routes, error } = useRoutes();
const journey = useJourney();
const dailySteps = computed(() => journey.journey.value?.journey.dailySteps ?? 0);
const doneKm = journey.kmOnRoute;
const todayKm = journey.kmToday;
const route = computed(
  () => routes.value.find((r) => r.id === journey.journey.value?.journey.routeId) ?? routes.value[0] ?? null,
);
</script>

<template>
  <BaseDialog
    :open="open"
    :title="t('map.title')"
    hide-title
    size="wide"
    :escape-closes="false"
    :corner-close-label="t('map.close')"
    :back-label="t('menu.back')"
    @update:open="emit('update:open', $event)"
    @back="emit('back')"
  >
    <div class="map-dialog">
      <RouteMap :path="route?.path ?? null" :length-km="route?.lengthKm ?? 0" :done-km="doneKm" :today-km="todayKm" />
      <div class="map-dialog__note">
        <p v-if="error" class="map-dialog__error" role="alert">{{ t(error) }}</p>
        <JourneyProgress
          v-if="route"
          :route-id="route.id"
          :length-km="route.lengthKm"
          :done-km="doneKm"
          :today-km="todayKm"
          :daily-steps="dailySteps"
        />
      </div>
    </div>
  </BaseDialog>
</template>

<style scoped>
.map-dialog {
  position: relative;
  flex: 1;
  min-height: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--paper-line);
}
.map-dialog__note {
  position: absolute;
  left: var(--space-3);
  bottom: var(--space-3);
  width: min(240px, calc(100% - 2 * var(--space-3)));
  padding: var(--space-3);
  border-radius: 10px;
  background: var(--paper);
  border: 1px solid var(--paper-line);
  box-shadow: 0 6px 18px rgba(10, 8, 20, 0.2);
}
.map-dialog__error {
  margin: 0;
  color: var(--rust-deep);
  font-size: var(--text-sm);
}
</style>
