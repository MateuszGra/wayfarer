import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { requestPasswordReset, resetPassword } from '@/shared/api/auth';
import { apiErrorMessage } from '@/shared/api/errorMessages';
import { useSession } from '@/shared/composables/useSession';

/** Asking for a password link, and setting the new password from it, which signs the player in. */
export function usePasswordReset() {
  const router = useRouter();
  const pending = ref(false);
  const error = ref<string | null>(null);
  const requested = ref(false);

  const run = async (call: () => Promise<void>): Promise<void> => {
    if (pending.value) return;
    pending.value = true;
    error.value = null;
    try {
      await call();
    } catch (failure) {
      error.value = apiErrorMessage(failure);
    } finally {
      pending.value = false;
    }
  };

  return {
    pending,
    error,
    requested,
    request: (email: string) =>
      run(async () => {
        await requestPasswordReset(email);
        requested.value = true;
      }),
    reset: (token: string, newPassword: string) =>
      run(async () => {
        useSession().signedIn(await resetPassword(token, newPassword));
        await router.push('/scene');
      }),
  };
}
