import { ref } from 'vue';
import { confirmEmail } from '@/shared/api/auth';
import { apiErrorMessage } from '@/shared/api/errorMessages';
import { useSession } from '@/shared/composables/useSession';
import { t } from '@/shared/i18n';

export type ConfirmationState = 'pending' | 'done' | 'failed';

/** Confirms the address from the e-mail's link, which signs the player in: waiting, done, or what went wrong. */
export function useEmailConfirmation() {
  const state = ref<ConfirmationState>('pending');
  const error = ref<string | null>(null);

  const confirm = async (token: unknown): Promise<void> => {
    if (typeof token !== 'string' || token === '') {
      state.value = 'failed';
      error.value = t('errors.verification_invalid');
      return;
    }
    try {
      useSession().signedIn(await confirmEmail(token));
      state.value = 'done';
    } catch (failure) {
      state.value = 'failed';
      error.value = apiErrorMessage(failure);
    }
  };

  return { state, error, confirm };
}
