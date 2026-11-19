import { onMounted, ref, shallowRef } from 'vue';
import type { RouteSummaryDto } from '@shared/api/contracts';
import { ApiRequestError } from '@/shared/api/client';
import { errorMessageKey } from '@/shared/api/errorMessages';
import type { TranslationKey } from '@/shared/i18n';
import { fetchRoutes } from '../api/routes';

export function useRoutes(load: typeof fetchRoutes = fetchRoutes) {
  const routes = shallowRef<readonly RouteSummaryDto[]>([]);
  const loading = ref(true);
  const error = ref<TranslationKey | null>(null);

  onMounted(async () => {
    try {
      routes.value = await load();
    } catch (failure) {
      error.value = failure instanceof ApiRequestError ? errorMessageKey(failure.code) : 'plan.routesError';
    } finally {
      loading.value = false;
    }
  });

  return { routes, loading, error };
}
