import { Card, Col, Row, Table, Typography } from 'antd';

import { Bars, Shares, TelemetryPage } from './shared';

interface Usage {
  daily: { date: string; installs: number; users: number; sessions: number }[];
  features: { name: string; uses: number; people: number }[];
  screens: { name: string; views: number }[];
  funnel: { step: string; people: number }[];
  retention: { week: string; signed_up: number; came_back: number; came_back_pct: number }[];
  busiest_hours: { hour: number; sessions: number }[];
  cities: { city: string; people: number }[];
}

const STEPS: Record<string, string> = {
  signed_up: 'Signed up',
  verified: 'verified their identity',
  booked: 'booked a job',
  paid: 'paid for a booking',
};

/** "booking_created" -> "Booking created". */
const readable = (name: string) => (name.charAt(0).toUpperCase() + name.slice(1)).replace(/_/g, ' ');

/** Who uses the app, what for, and when. */
export function UsagePage() {
  return (
    <TelemetryPage<Usage> title="Usage" path="/admin/telemetry/usage">
      {(d) => {
        const first = d.funnel[0]?.people ?? 0;
        return (
          <>
            <Card title="People using the app each day">
              <Bars
                label="Daily active people"
                items={d.daily.map((x) => ({ key: x.date, value: x.users, tip: `${x.date}: ${x.users} people, ${x.installs} phones, ${x.sessions} sessions` }))}
              />
            </Card>
            <Card title={`People who joined in this period (${first.toLocaleString()}): how many have…`}>
              <Shares
                unit="people"
                one="person"
                items={d.funnel
                  .filter((s) => s.step !== 'signed_up')
                  .map((s) => ({
                    label: `${STEPS[s.step] ?? s.step}${first ? ` (${Math.round((s.people / first) * 100)}%)` : ''}`,
                    value: s.people,
                  }))}
              />
            </Card>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="Features used">
                  <Table dataSource={d.features} rowKey="name" pagination={false} size="small">
                    <Table.Column<Usage['features'][number]> dataIndex="name" title="Feature" render={readable} />
                    <Table.Column<Usage['features'][number]> dataIndex="uses" title="Uses" />
                    <Table.Column<Usage['features'][number]> dataIndex="people" title="People" />
                  </Table>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Most viewed screens">
                  <Shares unit="views" one="view" items={d.screens.map((s) => ({ label: <Typography.Text code>{s.name}</Typography.Text>, value: s.views }))} />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Busiest hours (Uganda time)">
                  <Bars
                    label="Sessions by hour"
                    items={d.busiest_hours.map((h) => ({ key: String(h.hour), value: h.sessions, tip: `${String(h.hour).padStart(2, '0')}:00 – ${h.sessions} sessions` }))}
                  />
                  <Typography.Text type="secondary">midnight → 23:00</Typography.Text>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Cities">
                  <Shares unit="people" one="person" items={d.cities.map((c) => ({ label: c.city, value: c.people }))} />
                </Card>
              </Col>
              <Col xs={24}>
                <Card title="Coming back: people who used the app again a week or more after signing up">
                  <Table dataSource={d.retention} rowKey="week" pagination={false} size="small">
                    <Table.Column<Usage['retention'][number]> dataIndex="week" title="Signed up in the week of" />
                    <Table.Column<Usage['retention'][number]> dataIndex="signed_up" title="People" />
                    <Table.Column<Usage['retention'][number]> dataIndex="came_back" title="Came back" />
                    <Table.Column<Usage['retention'][number]> dataIndex="came_back_pct" title="Share" render={(v: number) => `${v}%`} />
                  </Table>
                </Card>
              </Col>
            </Row>
          </>
        );
      }}
    </TelemetryPage>
  );
}
