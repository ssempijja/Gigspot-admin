import { Alert, Button, Card, Col, DatePicker, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { Link } from 'react-router';

import { api } from '../../api';
import { ugx } from '../../components/format';

interface Side {
  id: number | string;
  status: string;
  amount: string;
  booking_id?: number | null;
  currency?: string;
}

interface Issue {
  kind: string;
  tx_ref: string;
  ours: Side | null;
  provider: Side | null;
}

interface Report {
  range: { from: string; to: string };
  ours: { completed: number; amount: string };
  provider: { successful: number; amount: string };
  issues: Issue[];
  truncated: boolean;
}

/** Matches the API's limit. */
const MAX_DAYS = 31;

const KINDS: Record<string, { label: string; color: string }> = {
  completed_here_not_paid_there: { label: 'Completed here, not paid at Flutterwave', color: 'red' },
  paid_there_not_recorded_here: { label: 'Paid at Flutterwave, not recorded here', color: 'orange' },
  amount_differs: { label: 'Amounts differ', color: 'gold' },
  unknown_here: { label: 'Unknown here', color: 'purple' },
};

const side = (s: Side | null) => (s ? `${s.status} · ${ugx(s.amount)}` : '—');

/** Our completed checkout payments against Flutterwave's, for a date range. */
export function ReconciliationPage() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(6, 'day'), dayjs()]);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const query = { from: range[0].format('YYYY-MM-DD'), to: range[1].format('YYYY-MM-DD') };
      setReport((await api<Report>('/admin/payments/reconciliation', { query })).data);
    } catch (e) {
      setReport(null);
      setError(e instanceof Error ? e.message : 'The report failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Reconciliation
      </Typography.Title>
      <Card>
        <Space wrap>
          <DatePicker.RangePicker
            value={range}
            allowClear={false}
            disabledDate={(d) => d.isAfter(dayjs(), 'day')}
            onChange={(v) => v?.[0] && v[1] && setRange([v[0], v[1]])}
          />
          <Button type="primary" loading={busy} disabled={range[1].diff(range[0], 'day') >= MAX_DAYS} onClick={() => void run()}>
            Compare with Flutterwave
          </Button>
          <Typography.Text type="secondary">At most {MAX_DAYS} days at a time. Test payments are left out.</Typography.Text>
        </Space>
      </Card>
      {error && <Alert type="error" showIcon message={error} />}
      {report && (
        <>
          {report.truncated && <Alert type="warning" showIcon message="Flutterwave returned more pages than we read. Narrow the range and run again." />}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card>
                <Statistic title={`Completed here (${report.ours.completed})`} value={ugx(report.ours.amount)} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card>
                <Statistic title={`Successful at Flutterwave (${report.provider.successful})`} value={ugx(report.provider.amount)} />
              </Card>
            </Col>
          </Row>
          <Card title={report.issues.length ? `${report.issues.length} differences` : 'Everything matches'}>
            <Table<Issue> dataSource={report.issues} rowKey={(i) => `${i.kind}-${i.tx_ref}`} pagination={false} size="small" scroll={{ x: 700 }}>
              <Table.Column<Issue> dataIndex="kind" title="Problem" render={(k: string) => <Tag color={KINDS[k]?.color}>{KINDS[k]?.label ?? k}</Tag>} />
              <Table.Column<Issue> dataIndex="tx_ref" title="Reference" render={(r: string) => <Typography.Text code copyable>{r}</Typography.Text>} />
              <Table.Column<Issue>
                dataIndex="ours"
                title="Here"
                render={(s: Side | null) => (s ? <Link to={`/transactions/show/${s.id}`}>{side(s)}</Link> : '—')}
              />
              <Table.Column<Issue> dataIndex="provider" title="Flutterwave" render={side} />
            </Table>
          </Card>
        </>
      )}
    </Space>
  );
}
