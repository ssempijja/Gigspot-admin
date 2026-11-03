import { Alert, Card, Descriptions, Space, Typography } from 'antd';
import { Link, useParams } from 'react-router';

import { ActionButton } from '../../components/ActionButton';
import { DetailHeader, DetailState, useDetail } from '../../components/Detail';
import { PersonLink, StatusTag, ugx, when } from '../../components/format';
import { WalletFigures, type Figures } from './WalletFigures';
import { TransferTag, type WithdrawalRow } from './WithdrawalList';

interface WithdrawalDetail extends WithdrawalRow {
  wallet: Figures;
}

export function WithdrawalShow() {
  const { id } = useParams();
  const { data, error, isLoading, refresh } = useDetail<WithdrawalDetail>(`/admin/withdrawals/${id}`);

  return (
    <DetailState data={data} error={error} isLoading={isLoading}>
      {(w) => {
        const base = `/admin/withdrawals/${w.id}`;
        const open = ['pending', 'approved'].includes(w.status);
        // While Flutterwave holds the transfer, only Flutterwave can settle it.
        const decidable = open && !w.transfer_in_flight;
        const checkField = w.transfer_unconfirmed
          ? [{ name: 'checked_with_provider', label: `I checked Flutterwave for transfer ${w.payout_reference}`, type: 'checkbox' as const }]
          : [];
        const toBody = (v: Record<string, unknown>) => ({ ...v, checked_with_provider: v.checked_with_provider === true });
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <DetailHeader
              title={`Withdrawal #${w.id}`}
              tags={
                <>
                  <StatusTag value={w.status} />
                  <TransferTag w={w} />
                </>
              }
              actions={
                <>
                  {w.status === 'approved' && !w.provider_reference && (
                    <ActionButton
                      label="Retry transfer"
                      title="Start the Flutterwave transfer again?"
                      description={
                        w.transfer_unconfirmed
                          ? `A transfer (reference ${w.payout_reference}) was attempted. Retrying reuses that reference, so Flutterwave won't pay twice.`
                          : 'Flutterwave is asked to send the money.'
                      }
                      path={`${base}/retry-payout`}
                      permission="withdrawals.manage"
                      onDone={refresh}
                    />
                  )}
                  {w.transfer_in_flight && (
                    <ActionButton
                      label="Refresh transfer"
                      title="Ask Flutterwave about this transfer?"
                      description="When Flutterwave says it was paid or failed, the withdrawal settles itself."
                      path={`${base}/refresh-payout`}
                      permission="withdrawals.manage"
                      reason={false}
                      onDone={refresh}
                    />
                  )}
                  {decidable && (
                    <>
                      <ActionButton
                        label="Mark paid"
                        title="Record this withdrawal as paid?"
                        description={`Only when ${ugx(w.amount)} has reached ${w.payment_method.account_name ?? 'the professional'} (for example, sent by hand). The professional is told.`}
                        path={`${base}/mark-paid`}
                        permission="withdrawals.manage"
                        buttonProps={{ type: 'primary' }}
                        fields={checkField}
                        toBody={toBody}
                        onDone={refresh}
                      />
                      <ActionButton
                        label="Reject"
                        title="Turn this withdrawal down?"
                        description="The amount goes back to the professional's balance and they see your reason."
                        path={`${base}/reject`}
                        permission="withdrawals.manage"
                        danger
                        fields={checkField}
                        toBody={toBody}
                        onDone={refresh}
                      />
                    </>
                  )}
                </>
              }
            />
            {w.transfer_unconfirmed && (
              <Alert
                type="warning"
                showIcon
                message="A transfer was attempted but Flutterwave never confirmed it"
                description={`Look up reference ${w.payout_reference} in Flutterwave before marking this paid or rejecting it.`}
              />
            )}

            <Card title="Request">
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Professional">
                  <PersonLink user={w.professional} /> · {w.professional.phone_number}
                </Descriptions.Item>
                <Descriptions.Item label="Amount">{ugx(w.amount)}</Descriptions.Item>
                <Descriptions.Item label="Send to">
                  {w.payment_method.provider.toUpperCase()} {w.payment_method.payment_type.replace('_', ' ')} {w.payment_method.account_number}
                  {w.payment_method.account_name && ` (${w.payment_method.account_name})`}
                </Descriptions.Item>
                <Descriptions.Item label="Their note">{w.reason || '—'}</Descriptions.Item>
                <Descriptions.Item label="Requested">{when(w.created_at)}</Descriptions.Item>
                <Descriptions.Item label="Settled">
                  {w.processed_at ? (
                    <>
                      {when(w.processed_at)}
                      {w.processed_by && <> by {w.processed_by.full_name}</>}
                    </>
                  ) : (
                    '—'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Our reference">{w.payout_reference ? <Typography.Text code copyable>{w.payout_reference}</Typography.Text> : '—'}</Descriptions.Item>
                <Descriptions.Item label="Flutterwave id">{w.provider_reference ? <Typography.Text code copyable>{w.provider_reference}</Typography.Text> : '—'}</Descriptions.Item>
                <Descriptions.Item label="Staff notes" span={2}>
                  {w.admin_notes || '—'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Balance" extra={<Link to={`/wallets/show/${w.professional.id}`}>Wallet history</Link>}>
              <WalletFigures figures={w.wallet} />
            </Card>
          </Space>
        );
      }}
    </DetailState>
  );
}
