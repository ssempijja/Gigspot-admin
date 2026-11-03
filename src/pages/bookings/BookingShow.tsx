import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Descriptions, Image, List, Row, Skeleton, Space, Table, Tabs, Tag, Timeline, Typography } from 'antd';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { api } from '../../api';
import { ActionButton, useCan } from '../../components/ActionButton';
import { AuditHistoryLink, PermittedLink } from '../../components/PermittedLink';
import { day, StatusTag, ugx, when } from '../../components/format';
import type { BookingRow } from './BookingList';

interface BookingDetail extends BookingRow {
  details: string;
  location: string;
  scheduled_time: string;
  job_request_id: number | null;
  amounts: { total: string | null; platform_commission: string | null; professional: string | null };
  payment: { status: string; method: string | null; reference: string | null };
  completion: { notes: string | null; images: string[] };
  cancellation: { at: string; reason: string; by: number | null } | null;
  payout_hold: { reason: string; by: { full_name: string } | null; at: string } | null;
  review: { id: number; rating: number; comment: string; is_hidden: boolean } | null;
  transactions: { id: number; type: string; status: string; amount: string; provider_reference: string | null; created_at: string }[];
  messages_count: number;
  timeline: { at: string; event: string }[];
}

interface Message {
  id: number;
  sender: { full_name: string };
  message: string;
  image: string | null;
  created_at: string;
}

const CANCELLABLE = ['pending', 'confirmed', 'in_progress'];

function Messages({ bookingId }: { bookingId: number }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-booking-messages', bookingId],
    queryFn: async () => (await api<Message[]>(`/admin/bookings/${bookingId}/messages`, { query: { limit: 100 } })).data,
    enabled: open,
  });
  if (!open) {
    return (
      <Space direction="vertical">
        <Typography.Text type="secondary">This is a private conversation. Opening it is recorded in the audit log.</Typography.Text>
        <Button onClick={() => setOpen(true)}>Read the messages</Button>
      </Space>
    );
  }
  if (error) return <Alert type="error" showIcon message={(error as Error).message} />;
  if (isLoading || !data) return <Skeleton active />;
  return (
    <List
      dataSource={[...data].reverse()}
      locale={{ emptyText: 'No messages.' }}
      renderItem={(m) => (
        <List.Item>
          <List.Item.Meta
            title={
              <Space>
                {m.sender.full_name}
                <Typography.Text type="secondary">{when(m.created_at)}</Typography.Text>
              </Space>
            }
            description={
              <Space direction="vertical">
                {m.message}
                {m.image && <Image src={m.image} width={160} />}
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );
}

export function BookingShow() {
  const { id } = useParams();
  const client = useQueryClient();
  const canRefund = useCan('payments.refund');
  const key = ['admin-booking', id];
  const { data: b, isLoading, error } = useQuery({ queryKey: key, queryFn: async () => (await api<BookingDetail>(`/admin/bookings/${id}`)).data });
  const refresh = () => void client.invalidateQueries({ queryKey: key });

  if (error) return <Alert type="error" showIcon message={(error as Error).message} />;
  if (isLoading || !b) return <Skeleton active />;
  const base = `/admin/bookings/${b.id}`;
  const paid = b.payment_status === 'paid';
  const payoutPending = paid && !b.payout_released && b.status !== 'cancelled';

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            #{b.id} {b.title}
          </Typography.Title>
          <Space size={4}>
            <Tag>{b.kind === 'job' ? 'gig booking' : 'direct booking'}</Tag>
            <StatusTag value={b.status} />
            <StatusTag value={b.payment_status} />
            {b.on_hold && <Tag color="red">payout on hold</Tag>}
            {b.dispute && (
              <Link to={`/disputes/show/${b.dispute.id}`}>
                <Tag color="orange">dispute: {b.dispute.status.replace('_', ' ')}</Tag>
              </Link>
            )}
          </Space>
        </div>
        <Space wrap>
          <PermittedLink to={`/transactions?booking=${b.id}`} permission="payments.view">
            Transactions
          </PermittedLink>
          <AuditHistoryLink type="Booking" id={b.id} />
          {CANCELLABLE.includes(b.status) && (!paid || canRefund) && (
            <ActionButton
              danger
              label="Cancel booking"
              title="Cancel this booking?"
              description={paid ? `The client is refunded ${ugx(b.amounts.total)}. Both sides are told.` : 'Both sides are told.'}
              path={`${base}/cancel`}
              permission="bookings.manage"
              fields={b.job_request_id ? [{ name: 'reopen_gig', label: 'Put the gig back on the listings', type: 'checkbox' }] : []}
              onDone={refresh}
            />
          )}
          {['confirmed', 'in_progress'].includes(b.status) && paid && (
            <ActionButton
              label="Mark as done"
              title="Mark this job as done?"
              description="Use this when the professional can't. The client then has 24 hours to confirm."
              path={`${base}/complete`}
              permission="bookings.manage"
              onDone={refresh}
            />
          )}
          {payoutPending && !b.on_hold && (
            <ActionButton
              danger
              label="Hold payout"
              title="Hold the payout?"
              description="No automatic release and no release on the client's confirmation until lifted."
              path={`${base}/payout/hold`}
              permission="payouts.manage"
              onDone={refresh}
            />
          )}
          {b.on_hold && <ActionButton label="Lift hold" title="Lift the payout hold?" path={`${base}/payout/unhold`} permission="payouts.manage" onDone={refresh} />}
          {payoutPending && b.status === 'completed' && (
            <ActionButton
              label="Release payout now"
              title={`Release ${ugx(b.amounts.professional)} to the professional?`}
              path={`${base}/payout/release`}
              permission="payouts.manage"
              onDone={refresh}
            />
          )}
        </Space>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Booking">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Client">
                <Link to={`/users/show/${b.client.id}`}>{b.client.full_name}</Link> · {b.client.phone_number}
              </Descriptions.Item>
              <Descriptions.Item label="Professional">
                <Link to={`/users/show/${b.professional.id}`}>{b.professional.full_name}</Link> · {b.professional.phone_number}
              </Descriptions.Item>
              <Descriptions.Item label="When">
                {day(b.scheduled_date)} {b.scheduled_time}
              </Descriptions.Item>
              <Descriptions.Item label="Where">{b.location || '—'}</Descriptions.Item>
              <Descriptions.Item label="Total">{ugx(b.amounts.total)}</Descriptions.Item>
              <Descriptions.Item label="Professional gets">{ugx(b.amounts.professional)}</Descriptions.Item>
              <Descriptions.Item label="Commission">{ugx(b.amounts.platform_commission)}</Descriptions.Item>
              <Descriptions.Item label="Paid with">{b.payment.method ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Details" span={2}>
                {b.details || '—'}
              </Descriptions.Item>
              {b.cancellation && (
                <Descriptions.Item label="Cancelled" span={2}>
                  {when(b.cancellation.at)}: {b.cancellation.reason}
                </Descriptions.Item>
              )}
              {b.payout_hold && (
                <Descriptions.Item label="Payout hold" span={2}>
                  {b.payout_hold.reason} ({b.payout_hold.by?.full_name ?? 'automatic'}, {when(b.payout_hold.at)})
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Timeline">
            <Timeline items={b.timeline.map((t) => ({ children: `${t.event.replace(/_/g, ' ')} · ${when(t.at)}` }))} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          items={[
            {
              key: 'money',
              label: 'Payments',
              children: (
                <Table dataSource={b.transactions} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }}>
                  <Table.Column dataIndex="type" title="Type" />
                  <Table.Column dataIndex="status" title="Status" render={(s: string) => <StatusTag value={s} />} />
                  <Table.Column dataIndex="amount" title="Amount" render={ugx} />
                  <Table.Column dataIndex="provider_reference" title="Flutterwave ref." render={(r: string | null) => r ?? '—'} />
                  <Table.Column dataIndex="created_at" title="When" render={when} />
                </Table>
              ),
            },
            {
              key: 'proof',
              label: 'Proof of work',
              children: b.completion.images.length ? (
                <Space direction="vertical">
                  <Image.PreviewGroup>
                    <Space wrap>
                      {b.completion.images.map((src) => (
                        <Image key={src} src={src} width={140} />
                      ))}
                    </Space>
                  </Image.PreviewGroup>
                  {b.completion.notes}
                </Space>
              ) : (
                <Typography.Text type="secondary">{b.completion.notes || 'No photos yet.'}</Typography.Text>
              ),
            },
            { key: 'chat', label: `Messages (${b.messages_count})`, children: <Messages bookingId={b.id} /> },
            {
              key: 'review',
              label: 'Review',
              children: b.review ? (
                <Space direction="vertical">
                  <Typography.Text>
                    {'★'.repeat(b.review.rating)}
                    {'☆'.repeat(5 - b.review.rating)} {b.review.is_hidden && <Tag color="red">hidden</Tag>}
                  </Typography.Text>
                  {b.review.comment}
                </Space>
              ) : (
                <Typography.Text type="secondary">No review.</Typography.Text>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
