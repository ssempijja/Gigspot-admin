import { useQuery } from '@tanstack/react-query';
import { Alert, Progress, Segmented, Skeleton, Space, Tooltip, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router';

import { api } from '../../api';

/** Shared by the App (telemetry) screens: the date range, loading, and simple bar charts. */

const RANGES = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

/** ?days= in the address bar (so a range can be shared), default 30. */
export function useDays(): [number, (days: number) => void] {
  const [params, setParams] = useSearchParams();
  const days = Number(params.get('days')) || 30;
  return [
    days,
    (value) => {
      const next = new URLSearchParams(params);
      next.set('days', String(value));
      setParams(next, { replace: true });
    },
  ];
}

/** GET [path]?days= for the current range. */
export function useTelemetry<T>(path: string) {
  const [days] = useDays();
  return useQuery({
    queryKey: [path, days],
    queryFn: async () => (await api<T>(path, { query: { days } })).data,
  });
}

export function TelemetryPage<T>({
  title,
  path,
  children,
  extra,
}: {
  title: string;
  path: string;
  extra?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  const [days, setDays] = useDays();
  const { data, isLoading, error } = useTelemetry<T>(path);
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        <Space wrap>
          {extra}
          <Segmented value={days} onChange={(v) => setDays(Number(v))} options={RANGES} />
        </Space>
      </Space>
      {error ? <Alert type="error" showIcon message={(error as Error).message} /> : isLoading || !data ? <Skeleton active /> : children(data)}
    </Space>
  );
}

/** Vertical bars over time (or over any labelled series). */
export function Bars({ items, height = 96, label }: { items: { key: string; value: number; tip: string }[]; height?: number; label: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <Typography.Text type="secondary">Nothing reported yet.</Typography.Text>;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }} aria-label={label}>
      {items.map((i) => (
        <Tooltip key={i.key} title={i.tip}>
          <div
            style={{
              flex: 1,
              minWidth: 2,
              height: `${Math.max(2, (i.value / max) * height)}px`,
              background: i.value ? '#1677ff' : '#e5e7eb',
              borderRadius: 2,
            }}
          />
        </Tooltip>
      ))}
    </div>
  );
}

/** A list of labelled horizontal bars (share of the largest). [unit] is plural, [one] its singular. */
export function Shares({ items, unit, one }: { items: { label: ReactNode; value: number }[]; unit: string; one: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <Typography.Text type="secondary">Nothing reported yet.</Typography.Text>;
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={4}>
      {items.map((i, index) => (
        <div key={index}>
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <span>{i.label}</span>
            <Typography.Text type="secondary">
              {i.value.toLocaleString()} {i.value === 1 ? one : unit}
            </Typography.Text>
          </Space>
          <Progress percent={(i.value / max) * 100} showInfo={false} size="small" />
        </div>
      ))}
    </Space>
  );
}

/** "840 ms" / "3.4 s" / "14 min" for durations. */
export function duration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms / 60_000)} min`;
}

/** A percentage, coloured: green when good. */
export function Health({ value, good = 99, bad = 95 }: { value: number; good?: number; bad?: number }) {
  const color = value >= good ? '#389e0d' : value < bad ? '#cf1322' : '#d48806';
  return <span style={{ color, fontWeight: 600 }}>{value.toFixed(1)}%</span>;
}
