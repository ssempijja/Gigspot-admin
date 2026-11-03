import { List } from '@refinedev/antd';
import { DatePicker, Input, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { Link } from 'react-router';

import { Json } from '../../components/Detail';
import { ExportButton } from '../../components/ExportButton';
import { when } from '../../components/format';
import { useAdminTable } from '../../components/useAdminTable';

interface Entry {
  id: number;
  actor_id: number | null;
  actor_email: string;
  permission: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: Record<string, { from?: unknown; to?: unknown }>;
  reason: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

/** Where an audited record lives in the panel, when it has a page. */
const PAGES: Record<string, string> = {
  User: '/users/show/',
  Booking: '/bookings/show/',
  JobDispute: '/disputes/show/',
  Transaction: '/transactions/show/',
  WithdrawalRequest: '/withdrawals/show/',
  Subscription: '/subscriptions/show/',
  Review: '/reviews/show/',
};

function entity(e: Entry) {
  const label = `${e.entity_type}${e.entity_id ? ` #${e.entity_id}` : ''}`;
  const page = PAGES[e.entity_type];
  return page && e.entity_id ? <Link to={`${page}${e.entity_id}`}>{label}</Link> : label;
}

/** Every staff action, newest first. Filters can come from the address bar (?entity_type=Booking&entity_id=4). */
export function AuditLog() {
  const { tableProps, setFilter, filterValue, exportQuery } = useAdminTable<Entry>(
    'audit-log',
    ['actor_id', 'entity_type', 'entity_id', 'action', 'permission', 'from', 'to'],
  );
  const from = filterValue('from') as string | undefined;
  const to = filterValue('to') as string | undefined;

  return (
    <List title="Audit log" headerButtons={<ExportButton path="/admin/audit-log/export" permission="audit.view" query={exportQuery} />}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search allowClear placeholder="Action, e.g. refund.retried" defaultValue={filterValue('action') as string | undefined} onSearch={(v) => setFilter('action', v.trim())} style={{ width: 230 }} />
        <Input.Search allowClear placeholder="Record type, e.g. Booking" defaultValue={filterValue('entity_type') as string | undefined} onSearch={(v) => setFilter('entity_type', v.trim())} style={{ width: 210 }} />
        <Input.Search allowClear placeholder="Record id" defaultValue={filterValue('entity_id') as string | undefined} onSearch={(v) => setFilter('entity_id', v.trim())} style={{ width: 130 }} />
        <Input.Search allowClear placeholder="Staff user id" defaultValue={filterValue('actor_id') as string | undefined} onSearch={(v) => setFilter('actor_id', v.trim())} style={{ width: 150 }} />
        <DatePicker.RangePicker
          value={[from ? dayjs(from) : null, to ? dayjs(to) : null]}
          onChange={(range) => {
            setFilter('from', range?.[0]?.startOf('day').toISOString());
            setFilter('to', range?.[1]?.endOf('day').toISOString());
          }}
        />
      </Space>
      <Table<Entry>
        {...tableProps}
        rowKey="id"
        scroll={{ x: 1000 }}
        expandable={{
          expandedRowRender: (e) => (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Json value={e.changes} />
              <Typography.Text type="secondary">
                {e.ip ?? 'no IP'} · {e.user_agent ?? 'no browser recorded'}
              </Typography.Text>
            </Space>
          ),
        }}
      >
        <Table.Column<Entry> dataIndex="created_at" title="When" width={170} render={when} />
        <Table.Column<Entry> dataIndex="actor_email" title="Who" render={(email: string) => email || <Tag>system</Tag>} />
        <Table.Column<Entry> dataIndex="action" title="Action" render={(a: string) => <Typography.Text code>{a}</Typography.Text>} />
        <Table.Column<Entry> title="Record" render={(_, e) => entity(e)} />
        <Table.Column<Entry> dataIndex="reason" title="Reason" render={(r: string | null) => r ?? '—'} />
      </Table>
    </List>
  );
}
