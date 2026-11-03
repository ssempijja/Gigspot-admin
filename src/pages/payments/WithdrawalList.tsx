import { List } from '@refinedev/antd';
import { Input, Select, Space, Table, Tag } from 'antd';
import { useNavigate } from 'react-router';

import { ExportButton } from '../../components/ExportButton';
import { PersonLink, StatusTag, ugx, when, type UserCard } from '../../components/format';
import { LinkedFilters } from '../../components/LinkedFilters';
import { useAdminTable } from '../../components/useAdminTable';

export interface WithdrawalRow {
  id: number;
  professional: UserCard;
  amount: string;
  status: string;
  payment_method: { payment_type: string; provider: string; account_number: string; account_name: string | null };
  reason: string | null;
  admin_notes: string | null;
  payout_reference: string | null;
  provider_reference: string | null;
  transfer_in_flight: boolean;
  transfer_unconfirmed: boolean;
  processed_by: UserCard | null;
  created_at: string;
  processed_at: string | null;
}

const STATUSES = ['pending', 'approved', 'processed', 'rejected'];

/** The transfer state worth flagging next to the status. */
export function TransferTag({ w }: { w: WithdrawalRow }) {
  if (w.transfer_in_flight) return <Tag color="blue">transfer in flight</Tag>;
  if (w.transfer_unconfirmed) return <Tag color="red">transfer unconfirmed</Tag>;
  return null;
}

export function WithdrawalList() {
  const navigate = useNavigate();
  const { tableProps, setFilter, filterValue, exportQuery, clearLinked } = useAdminTable<WithdrawalRow>('withdrawals', ['status', 'professional', 'search']);

  return (
    <List title="Withdrawals" headerButtons={<ExportButton dataset="withdrawals" query={exportQuery} />}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Name, phone or reference"
          defaultValue={filterValue('search') as string | undefined}
          onSearch={(v) => setFilter('search', v)}
          style={{ width: 240 }}
        />
        <Select allowClear placeholder="Status" style={{ width: 150 }} value={filterValue('status')} onChange={(v) => setFilter('status', v)} options={STATUSES.map((s) => ({ value: s, label: s }))} />
        <LinkedFilters labels={{ professional: 'Professional' }} filterValue={filterValue} clear={clearLinked} />
      </Space>
      <Table<WithdrawalRow>
        {...tableProps}
        rowKey="id"
        scroll={{ x: 900 }}
        onRow={(row) => ({ onClick: () => void navigate(`/withdrawals/show/${row.id}`), style: { cursor: 'pointer' } })}
      >
        <Table.Column<WithdrawalRow> dataIndex="id" title="#" width={70} />
        <Table.Column<WithdrawalRow> dataIndex="professional" title="Professional" render={(u: UserCard) => <PersonLink user={u} phone />} />
        <Table.Column<WithdrawalRow> dataIndex="amount" key="amount" title="Amount" sorter render={ugx} />
        <Table.Column<WithdrawalRow>
          dataIndex="status"
          title="Status"
          render={(s: string, w) => (
            <Space size={4} wrap>
              <StatusTag value={s} />
              <TransferTag w={w} />
            </Space>
          )}
        />
        <Table.Column<WithdrawalRow>
          dataIndex="payment_method"
          title="To"
          render={(m: WithdrawalRow['payment_method']) => `${m.provider.toUpperCase()} ${m.account_number}`}
        />
        <Table.Column<WithdrawalRow> dataIndex="created_at" key="created_at" title="Requested" sorter defaultSortOrder="descend" render={when} />
      </Table>
    </List>
  );
}
