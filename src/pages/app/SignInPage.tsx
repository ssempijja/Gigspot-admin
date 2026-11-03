import { Card, Col, Row, Statistic, Table } from 'antd';

import { Bars, duration, Shares, TelemetryPage } from './shared';

interface SignIn {
  successes: number;
  failures: number;
  p50_ms: number | null;
  p90_ms: number | null;
  max_ms: number | null;
  failure_reasons: { reason: string; count: number }[];
  by_method: { method: string; successes: number; failures: number; p50_ms: number | null }[];
  daily: { date: string; p50_ms: number | null; failures: number }[];
}

const REASONS: Record<string, string> = {
  wrong_password: 'Wrong password',
  no_account: 'No such account',
  network: 'No connection',
  otp_timeout: 'Code never arrived',
  otp_wrong: 'Wrong code',
  server: 'Server error',
  unknown: 'Unknown',
};

/** How long signing in takes, from opening the sign-in screen to being in, and why it fails. */
export function SignInPage() {
  return (
    <TelemetryPage<SignIn> title="Sign-in" path="/admin/telemetry/sign-in">
      {(d) => (
        <>
          <Row gutter={[16, 16]}>
            {[
              { title: 'Sign-ins', value: d.successes.toLocaleString() },
              { title: 'Failed attempts', value: d.failures.toLocaleString() },
              { title: 'Typical time (median)', value: duration(d.p50_ms) },
              { title: 'Slow (9 in 10 faster than)', value: duration(d.p90_ms) },
            ].map((s) => (
              <Col key={s.title} xs={12} md={6}>
                <Card>
                  <Statistic title={s.title} value={s.value} />
                </Card>
              </Col>
            ))}
          </Row>
          <Card title="Typical sign-in time per day">
            <Bars
              label="Median sign-in time per day"
              items={d.daily.map((x) => ({ key: x.date, value: x.p50_ms ?? 0, tip: `${x.date}: ${duration(x.p50_ms)}, ${x.failures} failed` }))}
            />
          </Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Why sign-in fails">
                <Shares unit="times" one="time" items={d.failure_reasons.map((r) => ({ label: REASONS[r.reason] ?? r.reason, value: r.count }))} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="By method">
                <Table dataSource={d.by_method} rowKey="method" pagination={false} size="small">
                  <Table.Column<SignIn['by_method'][number]> dataIndex="method" title="Method" />
                  <Table.Column<SignIn['by_method'][number]> dataIndex="successes" title="Signed in" />
                  <Table.Column<SignIn['by_method'][number]> dataIndex="failures" title="Failed" />
                  <Table.Column<SignIn['by_method'][number]> dataIndex="p50_ms" title="Typical time" render={duration} />
                </Table>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </TelemetryPage>
  );
}
