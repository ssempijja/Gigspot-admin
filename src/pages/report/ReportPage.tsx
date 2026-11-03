import { PrinterOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Row, Segmented, Skeleton, Space, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';

import { api } from '../../api';
import { ugx } from '../../components/format';
import type { Overview } from '../dashboard/DashboardPage';

/** Share of [whole], one decimal ("43.2%"); "—" when there is nothing to divide. */
const pct = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '—');

const ROLES: Record<string, string> = { client: 'Clients', professional: 'Professionals', company: 'Companies', admin: 'Staff (admin role)' };
const STATUSES: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

interface Line {
  label: string;
  value: string;
  share?: string;
}

function Section({ title, lines }: { title: string; lines: Line[] }) {
  return (
    <Card title={title} size="small" className="gs-report-section">
      <Table<Line> dataSource={lines} rowKey="label" pagination={false} size="small" showHeader={false}>
        <Table.Column<Line> dataIndex="label" />
        <Table.Column<Line> dataIndex="value" align="right" render={(v: string) => <Typography.Text strong>{v}</Typography.Text>} />
        <Table.Column<Line> dataIndex="share" align="right" width={90} render={(v?: string) => <Typography.Text type="secondary">{v ?? ''}</Typography.Text>} />
      </Table>
    </Card>
  );
}

/**
 * The platform report the app's admin screen used to make, as a page to print
 * or save as PDF: users, professionals, bookings, money and subscriptions.
 */
export function ReportPage() {
  const [days, setDays] = useState(30);
  const { data: d, isLoading, error } = useQuery({
    queryKey: ['dashboard', days],
    queryFn: async () => (await api<Overview>('/admin/dashboard', { query: { days } })).data,
  });

  if (error) return <Alert type="error" showIcon message={(error as Error).message} />;
  if (isLoading || !d) return <Skeleton active />;

  const bookings = Object.values(d.bookings.by_status).reduce((a, b) => a + b, 0);
  const professionals = d.users.by_role.professional ?? 0;
  const verified = Math.max(professionals - d.professionals.pending_verification, 0);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }} className="gs-report">
      <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Gigspot platform report
          </Typography.Title>
          <Typography.Text type="secondary">
            {dayjs(d.range.from).format('D MMM YYYY')} – {dayjs(d.range.to).format('D MMM YYYY')} · made {dayjs().format('D MMM YYYY, HH:mm')}
          </Typography.Text>
        </div>
        <Space className="gs-no-print" wrap>
          <Segmented
            value={days}
            onChange={(v) => setDays(Number(v))}
            options={[
              { label: '7 days', value: 7 },
              { label: '30 days', value: 30 },
              { label: '90 days', value: 90 },
            ]}
          />
          <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
            Print or save as PDF
          </Button>
        </Space>
      </Space>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Section
            title="People"
            lines={[
              { label: 'All accounts', value: d.users.total.toLocaleString() },
              ...Object.entries(d.users.by_role).map(([role, n]) => ({
                label: ROLES[role] ?? role,
                value: n.toLocaleString(),
                share: pct(n, d.users.total),
              })),
              { label: `Joined in the last ${d.range.days} days`, value: d.users.new_in_range.toLocaleString() },
              { label: 'Suspended', value: d.users.suspended.toLocaleString() },
            ]}
          />
        </Col>
        <Col xs={24} md={12}>
          <Section
            title="Professionals"
            lines={[
              { label: 'Professional accounts', value: professionals.toLocaleString() },
              { label: 'Identity verified', value: verified.toLocaleString(), share: pct(verified, professionals) },
              { label: 'Waiting for verification', value: d.professionals.pending_verification.toLocaleString() },
              { label: 'Listed in search', value: d.professionals.active.toLocaleString() },
            ]}
          />
        </Col>
        <Col xs={24} md={12}>
          <Section
            title="Bookings (all time)"
            lines={[
              { label: 'All bookings', value: bookings.toLocaleString() },
              ...Object.entries(d.bookings.by_status).map(([status, n]) => ({
                label: STATUSES[status] ?? status,
                value: n.toLocaleString(),
                share: pct(n, bookings),
              })),
              { label: `New in the last ${d.range.days} days`, value: d.bookings.new_in_range.toLocaleString() },
              { label: `Completed in the last ${d.range.days} days`, value: d.bookings.completed_in_range.toLocaleString() },
            ]}
          />
        </Col>
        <Col xs={24} md={12}>
          <Section
            title={`Money (last ${d.range.days} days)`}
            lines={[
              { label: 'Payments received', value: ugx(d.money.payments_received.amount), share: `${d.money.payments_received.count}×` },
              { label: 'Commission earned', value: ugx(d.money.commission_earned.amount) },
              { label: 'Paid out to professionals', value: ugx(d.money.payouts_released.amount), share: `${d.money.payouts_released.count}×` },
              { label: 'Withdrawals paid', value: ugx(d.money.withdrawals_paid.amount), share: `${d.money.withdrawals_paid.count}×` },
              { label: 'Refunds', value: ugx(d.money.refunds.amount), share: `${d.money.refunds.count}×` },
            ]}
          />
        </Col>
        <Col xs={24} md={12}>
          <Section
            title="Gigs and jobs"
            lines={[
              { label: 'Open now', value: d.postings.open.toLocaleString() },
              { label: `Posted in the last ${d.range.days} days`, value: d.postings.new_in_range.toLocaleString() },
            ]}
          />
        </Col>
        <Col xs={24} md={12}>
          <Section
            title="Subscriptions"
            lines={[
              { label: 'With access now', value: d.subscriptions.active.toLocaleString() },
              ...d.subscriptions.by_plan.map((p) => ({ label: p.name, value: p.active.toLocaleString() })),
            ]}
          />
        </Col>
      </Row>
    </Space>
  );
}
