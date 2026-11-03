import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Skeleton, Space, Typography } from 'antd';
import type { ReactNode } from 'react';

import { api } from '../api';

/** One admin record by its API path, and a way to reload it after an action. */
export function useDetail<T>(path: string) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: [path], queryFn: async () => (await api<T>(path)).data });
  const refresh = () => void client.invalidateQueries({ queryKey: [path] });
  return { ...query, refresh };
}

/** Loading and error states for a detail page; renders [children] once [data] is there. */
export function DetailState<T>({ data, error, isLoading, children }: { data: T | undefined; error: unknown; isLoading: boolean; children: (data: T) => ReactNode }) {
  if (error) return <Alert type="error" showIcon message={(error as Error).message} />;
  if (isLoading || data === undefined) return <Skeleton active />;
  return <>{children(data)}</>;
}

/** Title, tags under it, and the action buttons on the right. */
export function DetailHeader({ title, tags, actions }: { title: ReactNode; tags?: ReactNode; actions?: ReactNode }) {
  return (
    <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {tags && <Space size={4} wrap>{tags}</Space>}
      </div>
      {actions && <Space wrap>{actions}</Space>}
    </Space>
  );
}

/** A JSON value (provider metadata, audit changes) as indented text. */
export function Json({ value }: { value: unknown }) {
  if (value === null || value === undefined || (typeof value === 'object' && Object.keys(value).length === 0)) return <>—</>;
  return (
    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12 }}>{JSON.stringify(value, null, 2)}</pre>
  );
}
