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

async function request<T>(path: string, init: RequestInit, fetcher: typeof fetch): Promise<T> {
  let response: Response;
  try {
    response = await fetcher(`/api${path}`, { ...init, headers: { accept: 'application/json', ...init.headers } });
  } catch {
    throw new ApiRequestError(null, null);
  }
  if (response.status === 204) return undefined as T;
  if (response.ok) return (await response.json()) as T;
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  throw new ApiRequestError(body?.error.code ?? 'unknown', response.status);
}

export function apiGet<T>(path: string, fetcher: typeof fetch = fetch): Promise<T> {
  return request<T>(path, {}, fetcher);
}

/** A JSON POST; a 204 answer resolves to undefined. */
export function apiPost<T = void>(path: string, body: object = {}, fetcher: typeof fetch = fetch): Promise<T> {
  return request<T>(
    path,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) },
    fetcher,
  );
}
