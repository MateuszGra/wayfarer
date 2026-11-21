import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ERROR_CODES } from '@shared/api/errorCodes';
import { confirmEmailWithCode, login, register, resendVerification } from '@/shared/api/auth';
import { ApiRequestError } from '@/shared/api/client';
import { apiErrorMessage } from '@/shared/api/errorMessages';
import { useSession } from '@/shared/composables/useSession';

export interface Credentials {
  email: string;
  password: string;
}

/** Only a path inside the game, so a crafted link can't send a freshly signed-in player to another site. */
function safeRedirect(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : null;
}

/**
 * Sends the sign-in and sign-up forms to the server and takes the player on once signed in. A new account,
 * or one whose address is still unconfirmed, waits for the link from the e-mail instead.
 */
export function useAuthForms() {
  const router = useRouter();
  const route = useRoute();
  const session = useSession();
  const pending = ref(false);
  const error = ref<string | null>(null);
  /** The address the confirmation link went to, while the player is asked to follow it. */
  const awaitingConfirmation = ref<string | null>(null);
  const resent = ref(false);

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

  // The router takes a player without a journey on to plan one.
  const goOn = () => router.push(safeRedirect(route.query['redirect']) ?? '/scene');

  const signIn = (c: Credentials) =>
    run(async () => {
      try {
        session.signedIn(await login(c.email, c.password));
      } catch (failure) {
        if (!(failure instanceof ApiRequestError && failure.code === ERROR_CODES.emailNotVerified)) throw failure;
        awaitingConfirmation.value = c.email;
        return;
      }
      await goOn();
    });

  return {
    pending,
    error,
    awaitingConfirmation,
    resent,
    login: signIn,
    register: (c: Credentials) =>
      run(async () => {
        await register(c.email, c.password);
        awaitingConfirmation.value = c.email;
      }),
    confirmCode: (code: string) =>
      run(async () => {
        if (!awaitingConfirmation.value) return;
        resent.value = false;
        session.signedIn(await confirmEmailWithCode(awaitingConfirmation.value, code));
        await goOn();
      }),
    resend: () =>
      run(async () => {
        if (!awaitingConfirmation.value) return;
        resent.value = false;
        await resendVerification(awaitingConfirmation.value);
        resent.value = true;
      }),
    backToSignIn: () => {
      awaitingConfirmation.value = null;
      resent.value = false;
      error.value = null;
    },
    clearError: () => {
      error.value = null;
    },
  };
}
