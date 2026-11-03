import { session } from './session';

/**
 * Calls to the Gigspot API. The admin API answers
 *   { success: true, data, meta? } or { success: false, error: { code, message, fields? } };
 * the app's own endpoints (used only to sign in) answer in Django REST shapes.
 */

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
    readonly errors?: FieldErrors,
  ) {
    super(message);
  }
}

export interface ApiResult<T> {
  data: T;
  meta?: { total: number; page: number; limit: number };
}

type Auth = 'admin' | 'app' | 'none';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, unknown>;
  auth?: Auth;
}

function queryString(query: Record<string, unknown> = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

/** A Django REST error body (sign-in only) as one readable message. */
function drfMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return 'Something went wrong.';
  const values = Object.values(body as Record<string, unknown>).flat();
  const first = values.find((v) => typeof v === 'string');
  return typeof first === 'string' ? first : 'Something went wrong.';
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const auth = options.auth ?? 'admin';
  const token = auth === 'admin' ? session.adminToken() : auth === 'app' ? session.appToken() : null;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  // The API's routes end with a slash, like Django's.
  const url = `${API_URL}${path.endsWith('/') ? path : `${path}/`}${queryString(options.query)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError('Cannot reach the Gigspot API. Check your connection.', 0, 'network_error');
  }
  const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);

  if (body && typeof body === 'object' && 'success' in body) {
    const envelope = body as { success: boolean; data: T; meta?: ApiResult<T>['meta']; error?: { code: string; message: string; fields?: FieldErrors } };
    if (envelope.success) return { data: envelope.data, meta: envelope.meta };
    const error = envelope.error ?? { code: 'error', message: 'Something went wrong.' };
    throw new ApiError(error.message, response.status, error.code, error.fields);
  }
  if (!response.ok) throw new ApiError(drfMessage(body), response.status, 'error');
  return { data: body as T };
}

/** A file download (CSV export) from the admin API. */
export async function download(path: string, query: Record<string, unknown> = {}): Promise<void> {
  const token = session.adminToken();
  const response = await fetch(`${API_URL}${path.endsWith('/') ? path : `${path}/`}${queryString(query)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new ApiError(body?.error?.message ?? 'The export failed.', response.status, 'export_failed');
  }
  const name = /filename="([^"]+)"/.exec(response.headers.get('content-disposition') ?? '')?.[1] ?? 'export.csv';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(await response.blob());
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}
