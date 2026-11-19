import { computed } from 'vue';
import type { DaySteps } from '@shared/steps/history';

// Until steps are synchronised, the history is fixed demo data: eleven finished days before today,
// which is day 12 of the journey (matching the scene's demo day counter).
const DEMO_STEPS = [10_432, 8_120, 12_650, 0, 9_870, 11_240, 10_010, 7_340, 13_420, 10_890, 9_950];

const isoDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function useStepHistory(today: Date = new Date()) {
  const history = computed<readonly DaySteps[]>(() =>
    DEMO_STEPS.map((steps, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (DEMO_STEPS.length - index));
      return { day: index + 1, date: isoDate(date), steps };
    }),
  );
  return { history };
}
