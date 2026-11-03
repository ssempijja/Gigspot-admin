import type { CrudFilter } from '@refinedev/core';
import { useTable } from '@refinedev/antd';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';

/**
 * A server-side table over an admin list. Filters named in [filterKeys] can
 * come from the address bar (e.g. /users?verification_status=pending), so the
 * dashboard and other pages can link straight to a filtered list. [path] is the
 * API path under /admin when it differs from the resource name.
 */
export function useAdminTable<T extends { id: number }>(resource: string, filterKeys: string[], path?: string) {
  const [params, setParams] = useSearchParams();
  const fromUrl = (): CrudFilter[] =>
    filterKeys.filter((key) => params.get(key)).map((key) => ({ field: key, operator: 'eq', value: params.get(key) }));
  const initial = fromUrl();
  const table = useTable<T>({
    resource,
    meta: path ? { path } : undefined,
    pagination: { pageSize: 25 },
    filters: { initial },
    sorters: { initial: [] },
  });
  // The page stays mounted when the address changes (e.g. the menu link to the
  // plain list after a filtered link), so follow the address bar.
  const search = params.toString();
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    table.setFilters((previous) => [...previous.filter((f) => !('field' in f) || !filterKeys.includes(f.field)), ...fromUrl()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the address bar drives this
  }, [search]);
  /** Drop a filter that came from a link, from the table and the address bar. */
  const clearLinked = (field: string) => {
    const next = new URLSearchParams(params);
    next.delete(field);
    setParams(next);
  };
  /** Set one filter (an empty value removes it), keeping the others. */
  const setFilter = (field: string, value: unknown) =>
    table.setFilters((previous) => [
      ...previous.filter((f) => !('field' in f) || f.field !== field),
      ...(value === undefined || value === null || value === '' ? [] : [{ field, operator: 'eq' as const, value }]),
    ]);
  const filterValue = (field: string) =>
    (table.filters.find((f) => 'field' in f && f.field === field) as { value?: unknown } | undefined)?.value;
  /** The current filters and sort as query parameters (for a CSV export of the same rows). */
  const exportQuery = (): Record<string, unknown> => {
    const query: Record<string, unknown> = {};
    for (const f of table.filters) if ('field' in f) query[f.field] = f.value;
    if (table.sorters.length) query.sort = table.sorters.map((s) => (s.order === 'desc' ? `-${s.field}` : s.field)).join(',');
    return query;
  };
  return { ...table, setFilter, filterValue, exportQuery, clearLinked };
}
