import { Alert, Card, Space, Table, Tag } from 'antd';
import { Link, useParams } from 'react-router';

import { ActionButton } from '../../components/ActionButton';
import { DetailHeader, DetailState, useDetail } from '../../components/Detail';
import { PersonLink, StatusTag, ugx, when, type UserCard } from '../../components/format';
import { WalletFigures, type Figures } from './WalletFigures';
import type { WithdrawalRow } from './WithdrawalList';

interface Adjustment {
  id: number;
  amount: string;
  reason: string;
  by: UserCard | null;
  created_at: string;
}

interface Wallet {
  user: UserCard;
  is_professional: boolean;
  figures: Figures;
  adjustments: Adjustment[];
  recent_withdrawals: WithdrawalRow[];
}

export function WalletShow() {
  const { id } = useParams();
  const { data, error, isLoading, refresh } = useDetail<Wallet>(`/admin/wallets/${id}`);

  return (
    <DetailState data={data} error={error} isLoading={isLoading}>
      {(w) => (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <DetailHeader
            title={<>Wallet: {w.user.full_name}</>}
            tags={<Tag>{w.user.role}</Tag>}
            actions={
              w.is_professional && (
                <ActionButton
                  label="Adjust balance"
                  title="Correct this balance"
                  description="A positive amount adds to the balance, a negative one takes from it (never below what is available). The professional is told, with your reason."
                  path={`/admin/wallets/${w.user.id}/adjustments`}
                  permission="wallet.adjust"
                  fields={[{ name: 'amount', label: 'Amount (UGX, e.g. 5000 or -2500)', type: 'text', required: true, pattern: /^-?\d+(\.\d{1,2})?$/, patternMessage: 'Use an amount like 5000 or -2500.' }]}
                  onDone={refresh}
                />
              )
            }
          />
          {!w.is_professional && <Alert type="info" showIcon message="Only professionals have a wallet; this account has no earnings." />}
          <Card title="Balance" extra={<PersonLink user={w.user} />}>
            <WalletFigures figures={w.figures} />
          </Card>
          <Card title="Manual adjustments (latest 50)">
            <Table<Adjustment> dataSource={w.adjustments} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }}>
              <Table.Column<Adjustment> dataIndex="amount" title="Amount" render={(a: string) => <span style={{ color: Number(a) < 0 ? '#cf1322' : undefined }}>{ugx(a)}</span>} />
              <Table.Column<Adjustment> dataIndex="reason" title="Reason" />
              <Table.Column<Adjustment> dataIndex="by" title="By" render={(u: UserCard | null) => u?.full_name ?? '—'} />
              <Table.Column<Adjustment> dataIndex="created_at" title="When" render={when} />
            </Table>
          </Card>
          <Card title="Recent withdrawals">
            <Table<WithdrawalRow> dataSource={w.recent_withdrawals} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }}>
              <Table.Column<WithdrawalRow> dataIndex="id" title="#" render={(wid: number) => <Link to={`/withdrawals/show/${wid}`}>#{wid}</Link>} />
              <Table.Column<WithdrawalRow> dataIndex="amount" title="Amount" render={ugx} />
              <Table.Column<WithdrawalRow> dataIndex="status" title="Status" render={(s: string) => <StatusTag value={s} />} />
              <Table.Column<WithdrawalRow> dataIndex="created_at" title="Requested" render={when} />
            </Table>
          </Card>
        </Space>
      )}
    </DetailState>
  );
}
