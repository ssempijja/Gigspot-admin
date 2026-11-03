import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Card, Descriptions, Skeleton, Space, Tag, Typography } from 'antd';
import { Link, useParams } from 'react-router';

import { api } from '../../api';
import { ActionButton } from '../../components/ActionButton';
import { AuditHistoryLink } from '../../components/PermittedLink';
import { StatusTag, ugx, when } from '../../components/format';
import type { DisputeRow } from './DisputeList';

interface DisputeDetail extends DisputeRow {
  description: string;
  resolution: string | null;
  resolved_by: { full_name: string } | null;
  booking_detail: {
    amounts: { total: string | null; professional: string | null };
    completion: { notes: string | null; images: string[] };
    status: string;
  };
}

const OPEN = ['open', 'under_review'];

export function DisputeShow() {
  const { id } = useParams();
  const client = useQueryClient();
  const key = ['admin-dispute', id];
  const { data: d, isLoading, error } = useQuery({ queryKey: key, queryFn: async () => (await api<DisputeDetail>(`/admin/disputes/${id}`)).data });
  const refresh = () => void client.invalidateQueries({ queryKey: key });

  if (error) return <Alert type="error" showIcon message={(error as Error).message} />;
  if (isLoading || !d) return <Skeleton active />;
  const base = `/admin/disputes/${d.id}`;
  const open = OPEN.includes(d.status);
  const money = d.booking.payment_status === 'paid' && !d.booking.payout_released;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Dispute #{d.id}
          </Typography.Title>
          <Space size={4}>
            <StatusTag value={d.status} />
            <Tag>{d.dispute_type}</Tag>
            {d.booking.on_hold && <Tag color="red">payout on hold</Tag>}
          </Space>
        </div>
        <Space wrap>
          <AuditHistoryLink type="JobDispute" id={d.id} />
          {open && (
            <Space wrap>
            {d.status === 'open' && (
              <ActionButton
                label="Start review"
                title="Start reviewing this dispute?"
                description="Both sides are told someone is looking into it."
                path={`${base}/review`}
                permission="disputes.resolve"
                onDone={refresh}
              />
            )}
            <ActionButton
              label="Resolve"
              title="Resolve the dispute"
              buttonProps={{ type: 'primary' }}
              description={
                <Space direction="vertical">
                  <span>
                    <b>Refund the client</b>: everything paid ({ugx(d.booking.total_amount)}) goes back.
                  </span>
                  <span>
                    <b>Pay the professional</b>: they get {ugx(d.booking_detail.amounts.professional)} (the job must be marked done).
                  </span>
                  <span>
                    <b>Split</b>: the client gets back the amount you enter; the professional gets the rest minus commission.
                  </span>
                  {!money && <Alert type="info" showIcon message="There is no payment to move on this booking: settle it without moving money." />}
                </Space>
              }
              path={`${base}/resolve`}
              permission="disputes.resolve"
              fields={[
                {
                  name: 'outcome',
                  label: 'Outcome',
                  type: 'select',
                  required: true,
                  options: [
                    { value: 'refund_client', label: 'Refund the client' },
                    { value: 'release_professional', label: 'Pay the professional' },
                    { value: 'split', label: 'Split' },
                    { value: 'no_action', label: 'No money moves' },
                  ],
                },
                { name: 'client_amount', label: 'For a split: amount back to the client (UGX)', type: 'text', placeholder: '25000' },
                { name: 'resolution', label: 'Resolution (both sides read this)', type: 'textarea', required: true },
              ]}
              toBody={(v) => ({ ...v, client_amount: v.outcome === 'split' ? v.client_amount : undefined })}
              onDone={refresh}
            />
            <ActionButton
              label="Close without outcome"
              title="Close the dispute?"
              description="For a dispute both sides settled themselves. A payout held by the dispute follows its normal course."
              path={`${base}/close`}
              permission="disputes.resolve"
              onDone={refresh}
            />
            </Space>
          )}
        </Space>
      </Space>

      <Card title="What happened">
        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Raised by">
            <Link to={`/users/show/${d.raised_by.id}`}>{d.raised_by.full_name}</Link> on {when(d.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label="Booking">
            <Link to={`/bookings/show/${d.booking.id}`}>
              #{d.booking.id} {d.booking.title}
            </Link>
          </Descriptions.Item>
          <Descriptions.Item label="Client">{d.booking.client.full_name}</Descriptions.Item>
          <Descriptions.Item label="Professional">{d.booking.professional.full_name}</Descriptions.Item>
          <Descriptions.Item label="Booking status">
            <StatusTag value={d.booking.status} /> <StatusTag value={d.booking.payment_status} />
          </Descriptions.Item>
          <Descriptions.Item label="At stake">{ugx(d.booking.total_amount)}</Descriptions.Item>
          <Descriptions.Item label="Complaint" span={2}>
            {d.description}
          </Descriptions.Item>
          {d.booking_detail.completion.notes && (
            <Descriptions.Item label="Professional's notes" span={2}>
              {d.booking_detail.completion.notes}
            </Descriptions.Item>
          )}
          {d.resolution && (
            <Descriptions.Item label="Resolution" span={2}>
              {d.resolution} ({d.resolved_by?.full_name}, {when(d.resolved_at)})
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </Space>
  );
}
