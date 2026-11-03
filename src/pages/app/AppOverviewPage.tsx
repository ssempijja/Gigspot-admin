import { Card, Col, Row, Statistic, Table, Tag } from 'antd';
import { Link } from 'react-router';

import { StatusTag, when } from '../../components/format';
import { Bars, Health, TelemetryPage } from './shared';

interface Overview {
  active: { installs: number; users: number; sessions: number };
  stability: {
    crash_free_sessions: number;
    crash_free_users: number;
    by_version: { version: string; sessions: number; crashed_sessions: number; crash_free_sessions: number }[];
  };
  top_crashes: { id: number; title: string; kind: string; status: string; last_version: string; last_seen: string; crashes: number; people: number }[];
  daily: { date: string; installs: number; users: number; sessions: number; crashes: number }[];
}

/** How the app is doing: who uses it, and how often it crashes. */
export function AppOverviewPage() {
  return (
    <TelemetryPage<Overview> title="App" path="/admin/telemetry/overview">
      {(d) => (
        <>
          <Row gutter={[16, 16]}>
            {[
              { title: 'Phones using the app', value: d.active.installs },
              { title: 'People signed in', value: d.active.users },
              { title: 'Sessions', value: d.active.sessions },
            ].map((s) => (
              <Col key={s.title} xs={12} md={6}>
                <Card>
                  <Statistic title={s.title} value={s.value} />
                </Card>
              </Col>
            ))}
            <Col xs={12} md={6}>
              <Card>
                <Statistic title="Crash-free sessions" valueRender={() => <Health value={d.stability.crash_free_sessions} />} />
                <small>
                  people: <Health value={d.stability.crash_free_users} />
                </small>
              </Card>
            </Col>
          </Row>
          <Card title="Sessions per day">
            <Bars
              label="Sessions per day"
              items={d.daily.map((x) => ({
                key: x.date,
                value: x.sessions,
                tip: `${x.date}: ${x.sessions} sessions, ${x.users} people, ${x.crashes} crashes`,
              }))}
            />
          </Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card title="Top crashes" extra={<Link to="/app/crashes">All crashes</Link>}>
                <Table dataSource={d.top_crashes} rowKey="id" pagination={false} size="small" scroll={{ x: 500 }}>
                  <Table.Column<Overview['top_crashes'][number]>
                    dataIndex="title"
                    title="Crash"
                    render={(title: string, c) => <Link to={`/app/crashes/show/${c.id}`}>{title}</Link>}
                  />
                  <Table.Column<Overview['top_crashes'][number]> dataIndex="crashes" title="Times" />
                  <Table.Column<Overview['top_crashes'][number]> dataIndex="people" title="People" />
                  <Table.Column<Overview['top_crashes'][number]> dataIndex="status" title="Status" render={(s: string) => <StatusTag value={s} />} />
                  <Table.Column<Overview['top_crashes'][number]> dataIndex="last_seen" title="Last" render={when} />
                </Table>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="By app version">
                <Table dataSource={d.stability.by_version} rowKey="version" pagination={false} size="small">
                  <Table.Column<Overview['stability']['by_version'][number]> dataIndex="version" title="Version" render={(v: string, _r, i) => (i === 0 ? <Tag color="blue">{v}</Tag> : v)} />
                  <Table.Column<Overview['stability']['by_version'][number]> dataIndex="sessions" title="Sessions" />
                  <Table.Column<Overview['stability']['by_version'][number]>
                    dataIndex="crash_free_sessions"
                    title="Crash-free"
                    render={(v: number) => <Health value={v} />}
                  />
                </Table>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </TelemetryPage>
  );
}
