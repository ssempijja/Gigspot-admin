import { Alert, App, Card, Descriptions, Space, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import { Link, useParams } from 'react-router';

import { ActionButton } from '../../components/ActionButton';
import { DetailHeader, DetailState, Json, useDetail } from '../../components/Detail';
import { PersonLink, StatusTag, ugx, when } from '../../components/format';
import type { TransactionRow } from './TransactionList';

interface TransactionDetail extends TransactionRow {
  metadata: Record<string, unknown> | null;
  payment_method: { payment_type: string; provider: string } | null;
  related: TransactionRow[];
}

/** Matches the API: a refund can be retried or settled by hand once it has been open for an hour. */
const STUCK_AFTER_HOURS = 1;

export function TransactionShow() {
  const { id } = useParams();
  const { modal } = App.useApp();
  const { data, error, isLoading, refresh } = useDetail<TransactionDetail>(`/admin/transactions/${id}`);

  return (
    <DetailState data={data} error={error} isLoading={isLoading}>
      {(t) => {
        const base = `/admin/transactions/${t.id}`;
        const openRefund = t.transaction_type === 'refund' && ['processing', 'pending'].includes(t.status);
        const stuck = openRefund && dayjs().diff(dayjs(t.created_at), 'hour', true) >= STUCK_AFTER_HOURS;
        const afterSettle = (result: unknown) => {
          const warning = (result as { warning?: string } | null)?.warning;
          if (warning) modal.warning({ title: 'The client is still owed money', content: warning });
          refresh();
        };
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <DetailHeader
              title={`${t.transaction_type[0].toUpperCase()}${t.transaction_type.slice(1)} #${t.id}`}
              tags={<StatusTag value={t.status} />}
              actions={
                <>
                  {t.transaction_type === 'payment' && t.status === 'pending' && t.external_reference && (
                    <ActionButton
                      label="Re-check with Flutterwave"
                      title="Ask Flutterwave about this payment?"
                      description="If Flutterwave says it was paid or failed, the payment and its booking are updated."
                      path={`${base}/recheck`}
                      permission="payments.refund"
                      reason={false}
                      onDone={refresh}
                    />
                  )}
                  {stuck && (
                    <>
                      <ActionButton
                        label="Retry refund"
                        title="Send this refund to Flutterwave again?"
                        description={
                          <Alert
                            type="warning"
                            showIcon
                            message="Check Flutterwave first"
                            description="Look this refund up in the Flutterwave dashboard. If it was already paid, retrying pays the client twice: settle it as completed instead."
                          />
                        }
                        path={`${base}/retry-refund`}
                        permission="payments.refund"
                        fields={[{ name: 'checked_with_provider', label: 'I checked Flutterwave and this refund was not paid', type: 'checkbox' }]}
                        toBody={(v) => ({ ...v, checked_with_provider: v.checked_with_provider === true })}
                        onDone={refresh}
                      />
                      <ActionButton
                        label="Settle by hand"
                        title="Settle this refund by hand"
                        description="Completed: the client got the money (for example, paid another way). Failed: they did not, and are still owed it."
                        path={`${base}/settle-refund`}
                        permission="payments.refund"
                        fields={[
                          {
                            name: 'status',
                            label: 'Outcome',
                            type: 'select',
                            required: true,
                            options: [
                              { value: 'completed', label: 'Completed: the client has the money' },
                              { value: 'failed', label: 'Failed: the client was not paid' },
                            ],
                          },
                        ]}
                        onDone={afterSettle}
                      />
                    </>
                  )}
                </>
              }
            />
            {openRefund && !stuck && (
              <Alert type="info" showIcon message="This refund may still be on its way. It can be retried or settled an hour after it started." />
            )}

            <Card title="Details">
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Amount">{ugx(t.amount)}</Descriptions.Item>
                <Descriptions.Item label="Who">
                  <PersonLink user={t.user} /> · {t.user.phone_number}
                </Descriptions.Item>
                <Descriptions.Item label="Booking">{t.booking_id ? <Link to={`/bookings/show/${t.booking_id}`}>#{t.booking_id}</Link> : '—'}</Descriptions.Item>
                <Descriptions.Item label="Paid with">{t.payment_method ? `${t.payment_method.provider} ${t.payment_method.payment_type.replace('_', ' ')}` : '—'}</Descriptions.Item>
                <Descriptions.Item label="Our reference">{t.external_reference ? <Typography.Text code copyable>{t.external_reference}</Typography.Text> : '—'}</Descriptions.Item>
                <Descriptions.Item label="Flutterwave id">{t.provider_reference ? <Typography.Text code copyable>{t.provider_reference}</Typography.Text> : '—'}</Descriptions.Item>
                <Descriptions.Item label="Started">{when(t.created_at)}</Descriptions.Item>
                <Descriptions.Item label="Completed">{when(t.completed_at)}</Descriptions.Item>
                <Descriptions.Item label="Description" span={2}>
                  {t.description || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Provider data" span={2}>
                  <Json value={t.metadata} />
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {t.related.length > 0 && (
              <Card title="Other money on this booking">
                <Table<TransactionRow> dataSource={t.related} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }}>
                  <Table.Column<TransactionRow> dataIndex="id" title="#" render={(rid: number) => <Link to={`/transactions/show/${rid}`}>#{rid}</Link>} />
                  <Table.Column<TransactionRow> dataIndex="transaction_type" title="Type" />
                  <Table.Column<TransactionRow> dataIndex="status" title="Status" render={(s: string) => <StatusTag value={s} />} />
                  <Table.Column<TransactionRow> dataIndex="amount" title="Amount" render={ugx} />
                  <Table.Column<TransactionRow> dataIndex="created_at" title="When" render={when} />
                </Table>
              </Card>
            )}
          </Space>
        );
      }}
    </DetailState>
  );
}
