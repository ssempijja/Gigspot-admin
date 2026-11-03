import { Card, Col, Row, Table, Typography } from 'antd';

import { duration, TelemetryPage } from './shared';

interface Performance {
  screens: { name: string; views: number; p50_ms: number | null; p90_ms: number | null }[];
  app_api_calls: { name: string; calls: number; failure_rate: number; p50_ms: number | null; p90_ms: number | null }[];
  networks: { network_type: string; carrier: string; calls: number; failure_rate: number; p50_ms: number | null }[];
  cold_start: { version: string; starts: number; p50_ms: number | null; p90_ms: number | null }[];
  uploads: { name: string; uploads: number; failures: number; p50_ms: number | null; p90_ms: number | null }[];
  checkouts: { name: string; checkouts: number; failures: number; p50_ms: number | null }[];
  server_routes: {
    method: string;
    route: string;
    requests: number;
    avg_ms: number;
    max_ms: number;
    slow: number;
    client_error_rate: number;
    server_error_rate: number;
  }[];
}

const code = (text: string) => <Typography.Text code>{text}</Typography.Text>;
const rate = (v: number) => <span style={{ color: v >= 5 ? '#cf1322' : undefined }}>{v}%</span>;

/** What feels slow: screens, API calls from phones (by network), app start, uploads, checkout, and the API itself. */
export function PerformancePage() {
  return (
    <TelemetryPage<Performance> title="Performance" path="/admin/telemetry/performance">
      {(d) => (
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card title="Slowest screens to load">
              <Table dataSource={d.screens} rowKey="name" pagination={false} size="small" scroll={{ x: 450 }}>
                <Table.Column<Performance['screens'][number]> dataIndex="name" title="Screen" render={code} />
                <Table.Column<Performance['screens'][number]> dataIndex="views" title="Views" />
                <Table.Column<Performance['screens'][number]> dataIndex="p50_ms" title="Typical" render={duration} />
                <Table.Column<Performance['screens'][number]> dataIndex="p90_ms" title="Slow (p90)" render={duration} />
              </Table>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="API calls seen from phones">
              <Table dataSource={d.app_api_calls} rowKey="name" pagination={false} size="small" scroll={{ x: 500 }}>
                <Table.Column<Performance['app_api_calls'][number]> dataIndex="name" title="Call" render={code} />
                <Table.Column<Performance['app_api_calls'][number]> dataIndex="calls" title="Calls" />
                <Table.Column<Performance['app_api_calls'][number]> dataIndex="failure_rate" title="Failed" render={rate} />
                <Table.Column<Performance['app_api_calls'][number]> dataIndex="p90_ms" title="Slow (p90)" render={duration} />
              </Table>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="By network">
              <Table dataSource={d.networks} rowKey={(n) => `${n.network_type}-${n.carrier}`} pagination={false} size="small">
                <Table.Column<Performance['networks'][number]> dataIndex="carrier" title="Carrier" />
                <Table.Column<Performance['networks'][number]> dataIndex="network_type" title="Connection" />
                <Table.Column<Performance['networks'][number]> dataIndex="calls" title="Calls" />
                <Table.Column<Performance['networks'][number]> dataIndex="failure_rate" title="Failed" render={rate} />
                <Table.Column<Performance['networks'][number]> dataIndex="p50_ms" title="Typical" render={duration} />
              </Table>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="App start (from tap to first screen)">
              <Table dataSource={d.cold_start} rowKey="version" pagination={false} size="small">
                <Table.Column<Performance['cold_start'][number]> dataIndex="version" title="Version" />
                <Table.Column<Performance['cold_start'][number]> dataIndex="starts" title="Starts" />
                <Table.Column<Performance['cold_start'][number]> dataIndex="p50_ms" title="Typical" render={duration} />
                <Table.Column<Performance['cold_start'][number]> dataIndex="p90_ms" title="Slow (p90)" render={duration} />
              </Table>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="Uploads">
              <Table dataSource={d.uploads} rowKey="name" pagination={false} size="small">
                <Table.Column<Performance['uploads'][number]> dataIndex="name" title="What" />
                <Table.Column<Performance['uploads'][number]> dataIndex="uploads" title="Uploads" />
                <Table.Column<Performance['uploads'][number]> dataIndex="failures" title="Failed" />
                <Table.Column<Performance['uploads'][number]> dataIndex="p90_ms" title="Slow (p90)" render={duration} />
              </Table>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="Checkout (payment start to result)">
              <Table dataSource={d.checkouts} rowKey="name" pagination={false} size="small">
                <Table.Column<Performance['checkouts'][number]> dataIndex="name" title="Method" />
                <Table.Column<Performance['checkouts'][number]> dataIndex="checkouts" title="Checkouts" />
                <Table.Column<Performance['checkouts'][number]> dataIndex="failures" title="Failed" />
                <Table.Column<Performance['checkouts'][number]> dataIndex="p50_ms" title="Typical" render={duration} />
              </Table>
            </Card>
          </Col>
          <Col xs={24}>
            <Card title="The API itself (slowest routes on average)">
              <Table dataSource={d.server_routes} rowKey={(r) => `${r.method} ${r.route}`} pagination={false} size="small" scroll={{ x: 800 }}>
                <Table.Column<Performance['server_routes'][number]> title="Route" render={(_, r) => code(`${r.method} ${r.route}`)} />
                <Table.Column<Performance['server_routes'][number]> dataIndex="requests" title="Requests" />
                <Table.Column<Performance['server_routes'][number]> dataIndex="avg_ms" title="Average" render={duration} />
                <Table.Column<Performance['server_routes'][number]> dataIndex="max_ms" title="Slowest" render={duration} />
                <Table.Column<Performance['server_routes'][number]> dataIndex="slow" title="Over 1 s" />
                <Table.Column<Performance['server_routes'][number]> dataIndex="server_error_rate" title="Server errors" render={rate} />
                <Table.Column<Performance['server_routes'][number]> dataIndex="client_error_rate" title="Refused" render={(v: number) => `${v}%`} />
              </Table>
            </Card>
          </Col>
        </Row>
      )}
    </TelemetryPage>
  );
}
