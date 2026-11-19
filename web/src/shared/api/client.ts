import type { ApiErrorBody } from '@shared/api/errorCodes';

/** A failed API call. `code` is the API error code, or null when the network itself failed. */
export class ApiRequestError extends Error {
  constructor(
    readonly code: string | null,
    readonly status: number | null,
  ) {
    super(code ?? 'network_error');
  }
}

export async function apiGet<T>(path: string, fetcher: typeof fetch = fetch): Promise<T> {
  let response: Response;
  try {
    response = await fetcher(`/api${path}`, { headers: { accept: 'application/json' } });
  } catch {
    throw new ApiRequestError(null, null);
  }
  if (response.ok) return (await response.json()) as T;
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  throw new ApiRequestError(body?.error.code ?? 'unknown', response.status);
}
