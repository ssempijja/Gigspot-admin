import { Alert, Card, Descriptions, Space, Table, Tag } from 'antd';
import { Link, useParams } from 'react-router';

import { DetailHeader, DetailState, useDetail } from '../../components/Detail';
import { PersonLink, when, type UserCard } from '../../components/format';
import { duration } from './shared';

interface UserTelemetry {
  user: UserCard;
  last_seen: string | null;
  last_sign_in: { at: string; method: string; duration_ms: number | null } | null;
  devices: {
    platform: string;
    maker: string;
    model: string;
    os_version: string;
    app_version: string;
    outdated: boolean;
    network_type: string;
    carrier: string;
    analytics_enabled: boolean;
    first_seen: string;
    last_seen: string;
  }[];
  sessions: { started_at: string; app_version: string; network_type: string; duration_ms: number | null }[];
  crashes: { id: number; group_id: number; title: string; at: string; app_version: string; screen: string; fatal: boolean }[];
}

/** What one person's app reported: for answering "the app keeps closing" without asking them. Opening it is audited. */
export function UserTelemetryPage() {
  const { id } = useParams();
  const { data, error, isLoading } = useDetail<UserTelemetry>(`/admin/telemetry/users/${id}`);

  return (
    <DetailState data={data} error={error} isLoading={isLoading}>
      {(t) => (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <DetailHeader title={<>App activity: {t.user.full_name}</>} tags={<Tag>{t.user.role}</Tag>} actions={<PersonLink user={t.user} />} />
          <Alert type="info" showIcon message="Opening this page is recorded in the audit log." />
          <Card>
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Last seen in the app">{when(t.last_seen)}</Descriptions.Item>
              <Descriptions.Item label="Last sign-in">
                {t.last_sign_in ? `${when(t.last_sign_in.at)} (${t.last_sign_in.method}, took ${duration(t.last_sign_in.duration_ms)})` : '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="Phones">
            <Table dataSource={t.devices} rowKey={(d) => `${d.model}-${d.first_seen}`} pagination={false} size="small" scroll={{ x: 800 }}>
              <Table.Column<UserTelemetry['devices'][number]> title="Phone" render={(_, d) => `${d.maker} ${d.model}`.trim() || d.platform} />
              <Table.Column<UserTelemetry['devices'][number]> dataIndex="os_version" title="System" />
              <Table.Column<UserTelemetry['devices'][number]>
                dataIndex="app_version"
                title="App"
                render={(v: string, d) => (d.outdated ? <Tag color="orange">{v} (old)</Tag> : v)}
              />
              <Table.Column<UserTelemetry['devices'][number]> title="Network" render={(_, d) => [d.carrier, d.network_type].filter(Boolean).join(' · ') || '—'} />
              <Table.Column<UserTelemetry['devices'][number]>
                dataIndex="analytics_enabled"
                title="Usage analytics"
                render={(on: boolean) => (on ? 'on' : <Tag>turned off</Tag>)}
              />
              <Table.Column<UserTelemetry['devices'][number]> dataIndex="last_seen" title="Last seen" render={when} />
            </Table>
          </Card>
          <Card title="Recent crashes">
            <Table dataSource={t.crashes} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }}>
              <Table.Column<UserTelemetry['crashes'][number]> dataIndex="at" title="When" render={when} />
              <Table.Column<UserTelemetry['crashes'][number]>
                dataIndex="title"
                title="Crash"
                render={(title: string, c) => <Link to={`/app/crashes/show/${c.group_id}`}>{title}</Link>}
              />
              <Table.Column<UserTelemetry['crashes'][number]> dataIndex="screen" title="Screen" />
              <Table.Column<UserTelemetry['crashes'][number]> dataIndex="app_version" title="App" />
            </Table>
          </Card>
          <Card title="Recent sessions (last 90 days)">
            <Table dataSource={t.sessions} rowKey="started_at" pagination={false} size="small">
              <Table.Column<UserTelemetry['sessions'][number]> dataIndex="started_at" title="Started" render={when} />
              <Table.Column<UserTelemetry['sessions'][number]> dataIndex="duration_ms" title="Length" render={duration} />
              <Table.Column<UserTelemetry['sessions'][number]> dataIndex="app_version" title="App" />
              <Table.Column<UserTelemetry['sessions'][number]> dataIndex="network_type" title="Connection" />
            </Table>
          </Card>
        </Space>
      )}
    </DetailState>
  );
}
