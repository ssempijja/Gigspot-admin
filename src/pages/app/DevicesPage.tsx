import { Alert, Card, Col, Row, Table, Tag } from 'antd';
import { Link } from 'react-router';

import { PersonLink, when, type UserCard } from '../../components/format';
import { Shares, TelemetryPage } from './shared';

interface Devices {
  latest_version: string | null;
  installs: number;
  app_versions: { version: string; installs: number }[];
  platforms: { platform: string; installs: number }[];
  models: { maker: string; model: string; installs: number }[];
  os_versions: { os_version: string; installs: number }[];
  carriers: { carrier: string; installs: number }[];
  outdated: { installs: number; people: (UserCard & { app_version: string; last_seen: string })[] };
}

/** The phones the app runs on, and who still has an old version. */
export function DevicesPage() {
  return (
    <TelemetryPage<Devices> title="Phones" path="/admin/telemetry/devices">
      {(d) => (
        <>
          {d.outdated.installs > 0 && (
            <Alert
              type="info"
              showIcon
              message={`${d.outdated.installs} of ${d.installs} phones run a version older than ${d.latest_version}.`}
            />
          )}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} xl={8}>
              <Card title="App versions">
                <Shares
                  unit="phones"
                  one="phone"
                  items={d.app_versions.map((v) => ({
                    label: v.version === d.latest_version ? <Tag color="blue">{v.version} (latest)</Tag> : v.version,
                    value: v.installs,
                  }))}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Card title="Phone models">
                <Shares unit="phones" one="phone" items={d.models.map((m) => ({ label: `${m.maker} ${m.model}`.trim() || 'Unknown', value: m.installs }))} />
              </Card>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Card title="Android / iOS versions">
                <Shares unit="phones" one="phone" items={d.os_versions.map((o) => ({ label: o.os_version || 'Unknown', value: o.installs }))} />
              </Card>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Card title="Networks">
                <Shares unit="phones" one="phone" items={d.carriers.map((c) => ({ label: c.carrier || 'Unknown / Wi-Fi only', value: c.installs }))} />
              </Card>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Card title="Platforms">
                <Shares unit="phones" one="phone" items={d.platforms.map((p) => ({ label: p.platform, value: p.installs }))} />
              </Card>
            </Col>
          </Row>
          <Card title="Signed-in people on an old version (up to 50)">
            <Table dataSource={d.outdated.people} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }}>
              <Table.Column<Devices['outdated']['people'][number]> title="Person" render={(_, p) => <PersonLink user={p} phone />} />
              <Table.Column<Devices['outdated']['people'][number]> dataIndex="app_version" title="Version" />
              <Table.Column<Devices['outdated']['people'][number]> dataIndex="last_seen" title="Last seen" render={when} />
              <Table.Column<Devices['outdated']['people'][number]> title="" render={(_, p) => <Link to={`/app/users/${p.id}`}>App activity</Link>} />
            </Table>
          </Card>
        </>
      )}
    </TelemetryPage>
  );
}
