import { List } from '@refinedev/antd';
import { Input, Select, Space, Table, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router';

import { day, StatusTag, ugx } from '../../components/format';
import { ExportButton } from '../../components/ExportButton';
import { useAdminTable } from '../../components/useAdminTable';

interface Person {
  id: number;
  full_name: string;
  phone_number: string;
}

export interface BookingRow {
  id: number;
  kind: string;
  title: string;
  status: string;
  payment_status: string;
  total_amount: string | null;
  client: Person;
  professional: Person & { profile_id: number };
  scheduled_date: string;
  payout_released: boolean;
  on_hold: boolean;
  dispute: { id: number; status: string } | null;
  created_at: string;
}

const STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
const PAYMENTS = ['pending', 'paid', 'refunded'];

export function BookingList() {
  const navigate = useNavigate();
  const { tableProps, setFilter, filterValue, exportQuery } = useAdminTable<BookingRow>('bookings', [
    'status',
    'payment_status',
    'disputed',
    'on_hold',
    'search',
  ]);

  return (
    <List title="Bookings" headerButtons={<ExportButton dataset="bookings" query={exportQuery} />}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Title, place or name"
          defaultValue={filterValue('search') as string | undefined}
          onSearch={(v) => setFilter('search', v)}
          style={{ width: 240 }}
        />
        <Select allowClear placeholder="Status" style={{ width: 150 }} value={filterValue('status')} onChange={(v) => setFilter('status', v)} options={STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))} />
        <Select allowClear placeholder="Payment" style={{ width: 140 }} value={filterValue('payment_status')} onChange={(v) => setFilter('payment_status', v)} options={PAYMENTS.map((s) => ({ value: s, label: s }))} />
        <Select
          allowClear
          placeholder="Disputed"
          style={{ width: 130 }}
          value={filterValue('disputed')}
          onChange={(v) => setFilter('disputed', v)}
          options={[
            { value: 'true', label: 'Disputed' },
            { value: 'false', label: 'Not disputed' },
          ]}
        />
        <Select
          allowClear
          placeholder="Payout"
          style={{ width: 140 }}
          value={filterValue('on_hold')}
          onChange={(v) => setFilter('on_hold', v)}
          options={[
            { value: 'true', label: 'On hold' },
            { value: 'false', label: 'Not on hold' },
          ]}
        />
      </Space>
      <Table<BookingRow>
        {...tableProps}
        rowKey="id"
        scroll={{ x: 1000 }}
        onRow={(row) => ({ onClick: () => void navigate(`/bookings/show/${row.id}`), style: { cursor: 'pointer' } })}
      >
        <Table.Column<BookingRow> dataIndex="id" title="#" width={70} />
        <Table.Column<BookingRow>
          dataIndex="title"
          title="Booking"
          render={(title: string, b) => (
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{title}</Typography.Text>
              <Typography.Text type="secondary">
                {b.client.full_name} → {b.professional.full_name}
              </Typography.Text>
            </Space>
          )}
        />
        <Table.Column<BookingRow> dataIndex="status" title="Status" render={(s: string) => <StatusTag value={s} />} />
        <Table.Column<BookingRow> dataIndex="payment_status" title="Payment" render={(s: string) => <StatusTag value={s} />} />
        <Table.Column<BookingRow> dataIndex="total_amount" key="total_amount" title="Total" sorter render={ugx} />
        <Table.Column<BookingRow>
          title="Payout"
          render={(_, b) => (b.on_hold ? <Tag color="red">on hold</Tag> : b.payout_released ? <Tag color="green">released</Tag> : '—')}
        />
        <Table.Column<BookingRow> dataIndex="dispute" title="Dispute" render={(d: BookingRow['dispute']) => (d ? <StatusTag value={d.status} /> : '—')} />
        <Table.Column<BookingRow> dataIndex="created_at" key="created_at" title="Created" sorter defaultSortOrder="descend" render={day} />
      </Table>
    </List>
  );
}
