import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Col, List, Row, Segmented, Skeleton, Space, Statistic, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router';

import { api } from '../../api';
import { ugx } from '../../components/format';

export interface Overview {
  range: { from: string; to: string; days: number };
  users: { total: number; by_role: Record<string, number>; new_in_range: number; suspended: number };
  professionals: { profiles: number; active: number; pending_verification: number };
  postings: { open: number; new_in_range: number };
  bookings: { by_status: Record<string, number>; new_in_range: number; completed_in_range: number };
  money: Record<'payments_received' | 'refunds' | 'payouts_released' | 'commission_earned' | 'withdrawals_paid', { amount: string; count: number }>;
  queues: Record<string, number>;
  subscriptions: { active: number; by_plan: { code: string; name: string; active: number }[] };
  series: { date: string; signups: number; bookings: number; payments: string }[];
}

/** What each queue is and where staff deal with it. */
const QUEUES: { key: string; label: string; to?: string }[] = [
  { key: 'pending_verifications', label: 'Identity checks waiting', to: '/users?verification_status=pending' },
  { key: 'documents_to_review', label: 'Documents to review', to: '/users' },
  { key: 'open_disputes', label: 'Open disputes', to: '/disputes?status=open' },
  { key: 'payouts_on_hold', label: 'Payouts on hold', to: '/bookings?on_hold=true' },
  { key: 'withdrawals_to_settle', label: 'Withdrawals to settle', to: '/withdrawals' },
  { key: 'refunds_to_check', label: 'Refunds to check (over an hour)', to: '/transactions?stuck=true' },
  { key: 'review_reports_pending', label: 'Review reports', to: '/review-reports?status=pending' },
];

function Bars({ series }: { series: Overview['series'] }) {
  const max = Math.max(1, ...series.map((d) => d.bookings));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 96 }} aria-label="Bookings per day">
      {series.map((d) => (
        <Tooltip key={d.date} title={`${d.date}: ${d.bookings} bookings, ${d.signups} sign-ups, ${ugx(d.payments)} paid`}>
          <div
            style={{
              flex: 1,
              minWidth: 2,
              height: `${Math.max(2, (d.bookings / max) * 96)}px`,
              background: d.bookings ? '#1677ff' : '#e5e7eb',
              borderRadius: 2,
            }}
          />
        </Tooltip>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', days],
    queryFn: async () => (await api<Overview>('/admin/dashboard', { query: { days } })).data,
  });

  if (error) return <Alert type="error" showIcon message={(error as Error).message} />;
  if (isLoading || !data) return <Skeleton active />;
  const m = data.money;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Dashboard
        </Typography.Title>
        <Segmented
          value={days}
          onChange={(v) => setDays(Number(v))}
          options={[
            { label: '7 days', value: 7 },
            { label: '30 days', value: 30 },
            { label: '90 days', value: 90 },
          ]}
        />
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Users" value={data.users.total} suffix={<small>+{data.users.new_in_range}</small>} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Listed professionals" value={data.professionals.active} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Bookings in period" value={data.bookings.new_in_range} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Active subscriptions" value={data.subscriptions.active} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={`Money in the last ${data.range.days} days`}>
            <Row gutter={[16, 16]}>
              <Col xs={12}>
                <Statistic title="Payments received" value={ugx(m.payments_received.amount)} />
              </Col>
              <Col xs={12}>
                <Statistic title="Commission earned" value={ugx(m.commission_earned.amount)} />
              </Col>
              <Col xs={12}>
                <Statistic title="Payouts released" value={ugx(m.payouts_released.amount)} />
              </Col>
              <Col xs={12}>
                <Statistic title="Refunds" value={ugx(m.refunds.amount)} />
              </Col>
            </Row>
            <Typography.Text type="secondary" style={{ display: 'block', margin: '24px 0 8px' }}>
              Bookings per day
            </Typography.Text>
            <Bars series={data.series} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Waiting for staff">
            <List
              dataSource={QUEUES}
              renderItem={(q) => {
                const count = data.queues[q.key] ?? 0;
                return (
                  <List.Item extra={<Typography.Text strong={count > 0}>{count}</Typography.Text>}>
                    {q.to && count > 0 ? <Link to={q.to}>{q.label}</Link> : q.label}
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
