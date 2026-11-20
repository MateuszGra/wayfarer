import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { AccountDto } from '@shared/api/contracts';
import { login, register } from '@/shared/api/auth';
import { apiErrorMessage } from '@/shared/api/errorMessages';
import { signedInHome } from '@/shared/composables/usePlan';
import { useSession } from '@/shared/composables/useSession';

export interface Credentials {
  email: string;
  password: string;
}

/** Only a path inside the game, so a crafted link can't send a freshly signed-in player to another site. */
function safeRedirect(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : null;
}

/** Sends the sign-in and sign-up forms to the server and takes the player on once signed in. */
export function useAuthForms() {
  const router = useRouter();
  const route = useRoute();
  const session = useSession();
  const pending = ref(false);
  const error = ref<string | null>(null);

  const submit = async (call: () => Promise<AccountDto>): Promise<void> => {
    if (pending.value) return;
    pending.value = true;
    error.value = null;
    try {
      session.signedIn(await call());
      await router.push(safeRedirect(route.query['redirect']) ?? signedInHome());
    } catch (failure) {
      error.value = apiErrorMessage(failure);
    } finally {
      pending.value = false;
    }
  };

  return {
    pending,
    error,
    login: (c: Credentials) => submit(() => login(c.email, c.password)),
    register: (c: Credentials) => submit(() => register(c.email, c.password)),
    clearError: () => {
      error.value = null;
    },
  };
}
