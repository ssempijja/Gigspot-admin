import { List } from '@refinedev/antd';
import { Input, Select, Space, Table, Typography } from 'antd';
import { useNavigate } from 'react-router';

import { day, StatusTag, ugx } from '../../components/format';
import { ExportButton } from '../../components/ExportButton';
import { useAdminTable } from '../../components/useAdminTable';

export interface DisputeRow {
  id: number;
  dispute_type: string;
  status: string;
  raised_by: { id: number; full_name: string };
  booking: {
    id: number;
    title: string;
    status: string;
    payment_status: string;
    total_amount: string | null;
    payout_released: boolean;
    on_hold: boolean;
    client: { id: number; full_name: string };
    professional: { id: number; full_name: string };
  };
  created_at: string;
  resolved_at: string | null;
}

export function DisputeList() {
  const navigate = useNavigate();
  const { tableProps, setFilter, filterValue, exportQuery } = useAdminTable<DisputeRow>('disputes', ['status', 'dispute_type', 'search']);

  return (
    <List title="Disputes" headerButtons={<ExportButton dataset="disputes" query={exportQuery} />}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search allowClear placeholder="Description or booking" defaultValue={filterValue('search') as string | undefined} onSearch={(v) => setFilter('search', v)} style={{ width: 240 }} />
        <Select
          allowClear
          placeholder="Status"
          style={{ width: 150 }}
          value={filterValue('status')}
          onChange={(v) => setFilter('status', v)}
          options={['open', 'under_review', 'resolved', 'closed'].map((s) => ({ value: s, label: s.replace('_', ' ') }))}
        />
        <Select
          allowClear
          placeholder="Type"
          style={{ width: 150 }}
          value={filterValue('dispute_type')}
          onChange={(v) => setFilter('dispute_type', v)}
          options={['quality', 'payment', 'behavior', 'completion', 'other'].map((s) => ({ value: s, label: s }))}
        />
      </Space>
      <Table<DisputeRow>
        {...tableProps}
        rowKey="id"
        scroll={{ x: 900 }}
        onRow={(row) => ({ onClick: () => void navigate(`/disputes/show/${row.id}`), style: { cursor: 'pointer' } })}
      >
        <Table.Column<DisputeRow> dataIndex="id" title="#" width={70} />
        <Table.Column<DisputeRow>
          title="Booking"
          render={(_, d) => (
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{d.booking.title}</Typography.Text>
              <Typography.Text type="secondary">
                {d.booking.client.full_name} → {d.booking.professional.full_name}
              </Typography.Text>
            </Space>
          )}
        />
        <Table.Column<DisputeRow> dataIndex="dispute_type" title="Type" />
        <Table.Column<DisputeRow> dataIndex="status" title="Status" render={(s: string) => <StatusTag value={s} />} />
        <Table.Column<DisputeRow> title="At stake" render={(_, d) => ugx(d.booking.total_amount)} />
        <Table.Column<DisputeRow> title="Raised by" render={(_, d) => d.raised_by.full_name} />
        <Table.Column<DisputeRow> dataIndex="created_at" key="created_at" title="Opened" sorter defaultSortOrder="descend" render={day} />
      </Table>
    </List>
  );
}
