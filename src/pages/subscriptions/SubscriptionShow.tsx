import { Card, Descriptions, Space, Tag, Typography } from 'antd';
import { useParams } from 'react-router';

import { ActionButton } from '../../components/ActionButton';
import { DetailHeader, DetailState, Json, useDetail } from '../../components/Detail';
import { PersonLink, StatusTag, when } from '../../components/format';
import type { SubscriptionRow } from './SubscriptionList';

interface SubscriptionDetail extends SubscriptionRow {
  purchase_token: string | null;
  raw_state: unknown;
}

export function SubscriptionShow() {
  const { id } = useParams();
  const { data, error, isLoading, refresh } = useDetail<SubscriptionDetail>(`/admin/subscriptions/${id}`);

  return (
    <DetailState data={data} error={error} isLoading={isLoading}>
      {(s) => {
        const base = `/admin/subscriptions/${s.id}`;
        const play = s.source === 'google_play';
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <DetailHeader
              title={`${s.plan.name} · ${s.user.full_name}`}
              tags={
                <>
                  <StatusTag value={s.status} />
                  {s.entitled ? <Tag color="green">has access</Tag> : <Tag>no access</Tag>}
                  <Tag color={play ? 'default' : 'cyan'}>{play ? 'Google Play' : 'complimentary'}</Tag>
                </>
              }
              actions={
                <>
                  {play && s.purchase_token && (
                    <ActionButton
                      label="Re-check with Google Play"
                      title="Ask Google Play about this purchase?"
                      description="Picks up renewals, cancellations, expiry and refunds Google knows about."
                      path={`${base}/recheck`}
                      permission="subscriptions.manage"
                      reason={false}
                      onDone={refresh}
                    />
                  )}
                  {!play && s.status !== 'revoked' && (
                    <ActionButton
                      label="Revoke"
                      title="End this complimentary plan now?"
                      description="The person loses the plan's features straight away and is told."
                      path={`${base}/revoke`}
                      permission="subscriptions.manage"
                      danger
                      onDone={refresh}
                    />
                  )}
                </>
              }
            />
            <Card title="Subscription">
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Subscriber">
                  <PersonLink user={s.user} /> · {s.user.phone_number}
                </Descriptions.Item>
                <Descriptions.Item label="Plan">
                  {s.plan.name} ({s.plan.period})
                </Descriptions.Item>
                <Descriptions.Item label="Started">{when(s.started_at)}</Descriptions.Item>
                <Descriptions.Item label="Ends">{s.expires_at ? when(s.expires_at) : 'never'}</Descriptions.Item>
                <Descriptions.Item label="Renews by itself">{s.auto_renewing ? 'yes' : 'no'}</Descriptions.Item>
                <Descriptions.Item label="Last checked">{when(s.last_verified_at)}</Descriptions.Item>
                {play && (
                  <>
                    <Descriptions.Item label="Google order">{s.order_id ? <Typography.Text code copyable>{s.order_id}</Typography.Text> : '—'}</Descriptions.Item>
                    <Descriptions.Item label="Purchase token">{s.purchase_token ?? '—'}</Descriptions.Item>
                  </>
                )}
              </Descriptions>
              {play && (
                <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
                  Paid Google Play subscriptions are cancelled or refunded in the Play Console; Gigspot follows Google's notifications.
                </Typography.Paragraph>
              )}
            </Card>
            {play && (
              <Card title="What Google last said">
                <Json value={s.raw_state} />
              </Card>
            )}
          </Space>
        );
      }}
    </DetailState>
  );
}
