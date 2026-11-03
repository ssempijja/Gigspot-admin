import type { AccessControlProvider, AuthProvider, CrudFilter, DataProvider, HttpError } from '@refinedev/core';

import { api, ApiError, API_URL } from './api';
import { session } from './session';

/**
 * Refine's providers for the Gigspot admin API.
 * - Data: resource "users" is /api/admin/users; lists take page/limit, sort=-field
 *   and filters as query parameters.
 * - Auth: the session comes from the sign-in page (app account + authenticator code).
 * - Access: the signed-in staff member's permissions, from /api/admin/me.
 */

export interface Me {
  id: number;
  email: string;
  full_name: string;
  roles: string[];
  permissions: string[];
}

function toHttpError(error: unknown): HttpError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      errors: error.errors as HttpError['errors'],
    };
  }
  return { message: error instanceof Error ? error.message : 'Something went wrong.', statusCode: 500 };
}

async function call<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw toHttpError(error);
  }
}

function filterQuery(filters: CrudFilter[] = []): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  for (const filter of filters) {
    if ('field' in filter && filter.value !== undefined && filter.value !== null && filter.value !== '') {
      query[filter.field] = Array.isArray(filter.value) ? filter.value.join(',') : filter.value;
    }
  }
  return query;
}

export const dataProvider: DataProvider = {
  getApiUrl: () => API_URL,

  // A resource's API path is its name unless meta.path says otherwise (e.g. notifications/templates).
  getList: ({ resource, pagination, sorters, filters, meta }) =>
    call(async () => {
      const query: Record<string, unknown> = {
        ...filterQuery(filters),
        page: pagination?.currentPage ?? 1,
        limit: pagination?.pageSize ?? 25,
      };
      if (sorters?.length) query.sort = sorters.map((s) => (s.order === 'desc' ? `-${s.field}` : s.field)).join(',');
      const result = await api<never[]>(`/admin/${(meta?.path as string | undefined) ?? resource}`, { query });
      return { data: result.data, total: result.meta?.total ?? result.data.length };
    }),

  getOne: ({ resource, id, meta }) =>
    call(async () => ({ data: (await api<never>(`/admin/${(meta?.path as string | undefined) ?? resource}/${id}`)).data })),

  create: ({ resource, variables }) =>
    call(async () => ({ data: (await api<never>(`/admin/${resource}`, { method: 'POST', body: variables })).data })),

  update: ({ resource, id, variables }) =>
    call(async () => ({ data: (await api<never>(`/admin/${resource}/${id}`, { method: 'PATCH', body: variables })).data })),

  deleteOne: ({ resource, id, variables }) =>
    call(async () => ({ data: (await api<never>(`/admin/${resource}/${id}`, { method: 'DELETE', body: variables })).data })),

  custom: ({ url, method, payload, query }) =>
    call(async () => {
      const verb = method.toUpperCase() as 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
      return { data: (await api<never>(url, { method: verb, body: payload, query: query as Record<string, unknown> })).data };
    }),
};

let me: Promise<Me> | null = null;

/** The signed-in staff member (cached for the session). */
export function getMe(): Promise<Me> {
  me ??= api<Me>('/admin/me').then((r) => r.data);
  me.catch(() => {
    me = null;
  });
  return me;
}

export const authProvider: AuthProvider = {
  // The sign-in page drives the steps itself and stores the session; this only lands the user.
  login: () => Promise.resolve({ success: !!session.adminToken(), redirectTo: '/' }),

  logout: async () => {
    if (session.adminToken()) await api('/admin/auth/sign-out', { method: 'POST' }).catch(() => undefined);
    session.clear();
    me = null;
    return { success: true, redirectTo: '/login' };
  },

  check: () =>
    Promise.resolve(session.adminToken() ? { authenticated: true } : { authenticated: false, redirectTo: '/login', logout: true }),

  onError: (error: { statusCode?: number }) => {
    if (error?.statusCode === 401) {
      session.clear();
      me = null;
      return Promise.resolve({ logout: true, redirectTo: '/login', error: error as Error });
    }
    return Promise.resolve({});
  },

  getIdentity: () => getMe().catch(() => null),
  getPermissions: () => getMe().then((m) => m.permissions).catch(() => []),
};

/** The permission each menu entry needs. */
export const RESOURCE_PERMISSIONS: Record<string, string> = {
  dashboard: 'dashboard.view',
  users: 'users.view',
  bookings: 'bookings.view',
  disputes: 'disputes.view',
  transactions: 'payments.view',
  withdrawals: 'payments.view',
  wallets: 'payments.view',
  reconciliation: 'payments.view',
  subscriptions: 'subscriptions.view',
  plans: 'subscriptions.view',
  reviews: 'reviews.view',
  'review-reports': 'reviews.view',
  templates: 'notifications.view',
  'send-notification': 'notifications.send',
  'sent-notifications': 'notifications.view',
  staff: 'staff.manage',
  'audit-log': 'audit.view',
};

/** The screens under each menu group. */
export const MENU_GROUPS: Record<string, string[]> = {
  money: ['transactions', 'withdrawals', 'reconciliation'],
  plans_group: ['subscriptions', 'plans'],
  content: ['reviews', 'review-reports'],
  messaging: ['templates', 'send-notification', 'sent-notifications'],
  admin: ['staff', 'audit-log'],
};

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource }) => {
    const permissions = await getMe().then((m) => m.permissions).catch(() => [] as string[]);
    // A menu group (money, content, ...) shows when any of its screens does.
    const group = resource ? MENU_GROUPS[resource] : undefined;
    if (group) return { can: group.some((r) => permissions.includes(RESOURCE_PERMISSIONS[r])) };
    const needed = resource ? RESOURCE_PERMISSIONS[resource] : undefined;
    if (!needed) return { can: true };
    return permissions.includes(needed) ? { can: true } : { can: false, reason: `Needs ${needed}` };
  },
  options: { buttons: { enableAccessControl: true, hideIfUnauthorized: true } },
};
