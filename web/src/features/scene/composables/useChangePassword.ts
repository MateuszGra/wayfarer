import { ref } from 'vue';
import { changePassword } from '@/shared/api/auth';
import { apiErrorMessage } from '@/shared/api/errorMessages';

/** Sends a password change and keeps what the player should see: waiting, done, or what went wrong. */
export function useChangePassword() {
  const pending = ref(false);
  const changed = ref(false);
  const error = ref<string | null>(null);

  const submit = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (pending.value) return false;
    pending.value = true;
    changed.value = false;
    error.value = null;
    try {
      await changePassword(currentPassword, newPassword);
      changed.value = true;
      return true;
    } catch (failure) {
      error.value = apiErrorMessage(failure);
      return false;
    } finally {
      pending.value = false;
    }
  };
  const reset = (): void => {
    changed.value = false;
    error.value = null;
  };

  return { pending, changed, error, submit, reset };
}
