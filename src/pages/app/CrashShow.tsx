import { Card, Col, Collapse, Descriptions, Empty, Row, Space, Tag, Timeline, Typography } from 'antd';
import { Link, useParams } from 'react-router';

import { ActionButton } from '../../components/ActionButton';
import { DetailHeader, DetailState, useDetail } from '../../components/Detail';
import { PersonLink, StatusTag, when, type UserCard } from '../../components/format';
import { AuditHistoryLink } from '../../components/PermittedLink';
import type { CrashGroup } from './CrashList';
import { Shares } from './shared';

interface Occurrence {
  id: number;
  at: string;
  user_id: number | null;
  app_version: string;
  os_version: string;
  device_model: string;
  screen: string;
  message: string;
  fatal: boolean;
  breadcrumbs: { at: string; type: string; name: string }[];
  stack: string;
}

interface CrashDetail extends CrashGroup {
  versions: { version: string; crashes: number }[];
  devices: { model: string; os_version: string; crashes: number }[];
  people: UserCard[];
  recent: Occurrence[];
}

export function CrashShow() {
  const { id } = useParams();
  const { data, error, isLoading, refresh } = useDetail<CrashDetail>(`/admin/telemetry/crashes/${id}`);

  return (
    <DetailState data={data} error={error} isLoading={isLoading}>
      {(c) => {
        const status = (label: string, next: string, description: string) => (
          <ActionButton
            label={label}
            title={`${label}?`}
            description={description}
            path={`/admin/telemetry/crashes/${c.id}/status`}
            permission="telemetry.manage"
            toBody={(v) => ({ status: next, reason: v.reason })}
            onDone={refresh}
          />
        );
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <DetailHeader
              title={c.title}
              tags={
                <>
                  <StatusTag value={c.status} />
                  <Tag>{c.kind}</Tag>
                  <Tag>{c.occurrences} times</Tag>
                </>
              }
              actions={
                <>
                  <AuditHistoryLink type="TelemetryCrashGroup" id={c.id} />
                  {c.status !== 'resolved' &&
                    status('Mark fixed', 'resolved', 'Say which release fixes it. If it happens again in a newer version, it opens again by itself.')}
                  {c.status === 'open' && status('Ignore', 'ignored', 'For crashes outside our control (e.g. a broken phone model).')}
                  {c.status !== 'open' && status('Reopen', 'open', 'Back on the list of crashes to fix.')}
                </>
              }
            />
            <Card>
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Where" span={2}>
                  <Typography.Text code>{c.top_frame || '—'}</Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="First seen">
                  {when(c.first_seen)} in {c.first_version}
                </Descriptions.Item>
                <Descriptions.Item label="Last seen">
                  {when(c.last_seen)} in {c.last_version}
                </Descriptions.Item>
              </Descriptions>
            </Card>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card title="App versions">
                  <Shares unit="crashes" one="crash" items={c.versions.map((v) => ({ label: v.version, value: v.crashes }))} />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card title="Phones">
                  <Shares unit="crashes" one="crash" items={c.devices.map((d) => ({ label: `${d.model || 'Unknown'} · ${d.os_version || '?'}`, value: d.crashes }))} />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card title={`People affected (${c.people.length}${c.people.length === 50 ? '+' : ''})`}>
                  <Space direction="vertical" size={2}>
                    {c.people.map((p) => (
                      <span key={p.id}>
                        <PersonLink user={p} /> · <Link to={`/app/users/${p.id}`}>app activity</Link>
                      </span>
                    ))}
                    {c.people.length === 0 && <Typography.Text type="secondary">Only people who weren't signed in.</Typography.Text>}
                  </Space>
                </Card>
              </Col>
            </Row>
            <Card title="Recent crashes">
              <Collapse
                items={c.recent.map((o) => ({
                  key: o.id,
                  label: `${when(o.at)} · ${o.app_version} · ${o.device_model || 'unknown phone'} · ${o.screen || 'unknown screen'}${o.fatal ? '' : ' (not fatal)'}`,
                  children: (
                    <Row gutter={16}>
                      <Col xs={24} lg={9}>
                        <Typography.Title level={5}>Just before</Typography.Title>
                        <Timeline
                          items={[
                            ...o.breadcrumbs.map((b) => ({ children: `${b.type}: ${b.name}`, color: 'gray' })),
                            { children: `crash on ${o.screen || 'a screen'}`, color: 'red' },
                          ]}
                        />
                      </Col>
                      <Col xs={24} lg={15}>
                        <Typography.Title level={5}>Message and stack</Typography.Title>
                        <Typography.Paragraph>{o.message}</Typography.Paragraph>
                        <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', maxHeight: 360, overflow: 'auto', margin: 0 }}>{o.stack || 'No stack trace.'}</pre>
                        {o.user_id && <Link to={`/app/users/${o.user_id}`}>This person's app activity</Link>}
                      </Col>
                    </Row>
                  ),
                }))}
                defaultActiveKey={c.recent[0] ? [c.recent[0].id] : []}
              />
              {c.recent.length === 0 && <Empty description="No crash in the last 90 days (older ones are deleted)." />}
            </Card>
          </Space>
        );
      }}
    </DetailState>
  );
}
