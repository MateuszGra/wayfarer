import { ref } from 'vue';
import { fetchNotificationSettings, saveNotificationSettings } from '@/shared/api/notifications';
import { apiErrorMessage } from '@/shared/api/errorMessages';

/**
 * The player's notification settings. A change shows at once and goes back if the server refuses it,
 * with what went wrong.
 */
export function useNotificationSettings() {
  // Null until the server has answered; the switch waits for it.
  const stepReminders = ref<boolean | null>(null);
  const error = ref<string | null>(null);

  const load = async (): Promise<void> => {
    error.value = null;
    try {
      stepReminders.value = (await fetchNotificationSettings()).stepReminders;
    } catch (failure) {
      error.value = apiErrorMessage(failure);
    }
  };
  const setStepReminders = async (on: boolean): Promise<void> => {
    const before = stepReminders.value;
    stepReminders.value = on;
    error.value = null;
    try {
      stepReminders.value = (await saveNotificationSettings({ stepReminders: on })).stepReminders;
    } catch (failure) {
      stepReminders.value = before;
      error.value = apiErrorMessage(failure);
    }
  };

  return { stepReminders, error, load, setStepReminders };
}
