import { List } from '@refinedev/antd';
import { Input, Select, Space, Table, Typography } from 'antd';
import { Link, useNavigate } from 'react-router';

import { ExportButton } from '../../components/ExportButton';
import { PersonLink, StatusTag, ugx, when, type UserCard } from '../../components/format';
import { LinkedFilters } from '../../components/LinkedFilters';
import { useAdminTable } from '../../components/useAdminTable';

export interface TransactionRow {
  id: number;
  transaction_type: string;
  status: string;
  amount: string;
  user: UserCard;
  booking_id: number | null;
  external_reference: string | null;
  provider_reference: string | null;
  description: string;
  created_at: string;
  completed_at: string | null;
}

const TYPES = ['payment', 'refund', 'escrow_hold', 'escrow_release', 'withdrawal', 'commission', 'deposit'];
const STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'disputed'];

export function TransactionList() {
  const navigate = useNavigate();
  const { tableProps, setFilter, filterValue, exportQuery, clearLinked } = useAdminTable<TransactionRow>('transactions', [
    'transaction_type',
    'status',
    'stuck',
    'user',
    'booking',
    'search',
  ]);

  return (
    <List title="Transactions" headerButtons={<ExportButton dataset="transactions" query={exportQuery} />}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Reference, email or phone"
          defaultValue={filterValue('search') as string | undefined}
          onSearch={(v) => setFilter('search', v)}
          style={{ width: 240 }}
        />
        <Select allowClear placeholder="Type" style={{ width: 140 }} value={filterValue('transaction_type')} onChange={(v) => setFilter('transaction_type', v)} options={TYPES.map((t) => ({ value: t, label: t.replace('_', ' ') }))} />
        <Select allowClear placeholder="Status" style={{ width: 140 }} value={filterValue('status')} onChange={(v) => setFilter('status', v)} options={STATUSES.map((s) => ({ value: s, label: s }))} />
        <Select
          allowClear
          placeholder="Stuck refunds"
          style={{ width: 200 }}
          value={filterValue('stuck')}
          onChange={(v) => setFilter('stuck', v)}
          options={[{ value: 'true', label: 'Refunds open over an hour' }]}
        />
        <LinkedFilters labels={{ user: 'User', booking: 'Booking' }} filterValue={filterValue} clear={clearLinked} />
      </Space>
      <Table<TransactionRow>
        {...tableProps}
        rowKey="id"
        scroll={{ x: 1000 }}
        onRow={(row) => ({ onClick: () => void navigate(`/transactions/show/${row.id}`), style: { cursor: 'pointer' } })}
      >
        <Table.Column<TransactionRow> dataIndex="id" title="#" width={70} />
        <Table.Column<TransactionRow> dataIndex="transaction_type" title="Type" />
        <Table.Column<TransactionRow> dataIndex="status" title="Status" render={(s: string) => <StatusTag value={s} />} />
        <Table.Column<TransactionRow> dataIndex="amount" key="amount" title="Amount" sorter render={ugx} />
        <Table.Column<TransactionRow> dataIndex="user" title="Who" render={(u: UserCard) => <PersonLink user={u} phone />} />
        <Table.Column<TransactionRow>
          dataIndex="booking_id"
          title="Booking"
          render={(id: number | null) => (id ? <Link to={`/bookings/show/${id}`} onClick={(e) => e.stopPropagation()}>#{id}</Link> : '—')}
        />
        <Table.Column<TransactionRow>
          dataIndex="external_reference"
          title="Reference"
          render={(ref: string | null) => (ref ? <Typography.Text code>{ref}</Typography.Text> : '—')}
        />
        <Table.Column<TransactionRow> dataIndex="created_at" key="created_at" title="When" sorter defaultSortOrder="descend" render={when} />
      </Table>
    </List>
  );
}
