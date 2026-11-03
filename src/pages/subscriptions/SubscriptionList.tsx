import { List } from '@refinedev/antd';
import { Input, Select, Space, Table, Tag } from 'antd';
import { useNavigate } from 'react-router';

import { ActionButton } from '../../components/ActionButton';
import { ExportButton } from '../../components/ExportButton';
import { day, PersonLink, StatusTag, type UserCard } from '../../components/format';
import { LinkedFilters } from '../../components/LinkedFilters';
import { useAdminTable } from '../../components/useAdminTable';
import { usePlans } from './usePlans';

export interface SubscriptionRow {
  id: number;
  user: UserCard;
  plan: { code: string; name: string; period: string };
  source: string;
  status: string;
  entitled: boolean;
  order_id: string | null;
  started_at: string;
  expires_at: string | null;
  auto_renewing: boolean;
  last_verified_at: string | null;
  created_at: string;
}

const SOURCES = [
  { value: 'google_play', label: 'Google Play' },
  { value: 'complimentary', label: 'Complimentary' },
];

export function SubscriptionList() {
  const navigate = useNavigate();
  const { data: plans = [] } = usePlans();
  const { tableProps, setFilter, filterValue, exportQuery, tableQuery, clearLinked } = useAdminTable<SubscriptionRow>('subscriptions', [
    'plan',
    'source',
    'entitled',
    'status',
    'user',
    'search',
  ]);
  const planOptions = plans.map((p) => ({ value: p.code, label: `${p.name} (${p.audience})` }));

  return (
    <List
      title="Subscribers"
      headerButtons={
        <>
          <ActionButton
            label="Give a plan"
            title="Give someone a complimentary plan"
            description="For partners or goodwill. Lifetime plans never end; others last the number of days you give (default: the plan's own period). The person is told."
            path="/admin/subscriptions/grant"
            permission="subscriptions.manage"
            buttonProps={{ type: 'primary' }}
            fields={[
              { name: 'user', label: 'User id (from their user page)', type: 'text', required: true, pattern: /^\d+$/, patternMessage: 'Use digits only.' },
              { name: 'plan', label: 'Plan', type: 'select', required: true, options: planOptions },
              { name: 'days', label: 'Days (optional)', type: 'text', placeholder: '30', pattern: /^\d+$/, patternMessage: 'Use digits only.' },
            ]}
            toBody={(v) => ({ ...v, user: Number(v.user), days: v.days ? Number(v.days) : undefined })}
            onDone={(d) => {
              void tableQuery.refetch();
              const created = d as { id?: number } | null;
              if (created?.id) void navigate(`/subscriptions/show/${created.id}`);
            }}
          />
          <ExportButton dataset="subscriptions" query={exportQuery} />
        </>
      }
    >
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Name, email, phone or order"
          defaultValue={filterValue('search') as string | undefined}
          onSearch={(v) => setFilter('search', v)}
          style={{ width: 240 }}
        />
        <Select allowClear placeholder="Plan" style={{ width: 200 }} value={filterValue('plan')} onChange={(v) => setFilter('plan', v)} options={planOptions} />
        <Select allowClear placeholder="Source" style={{ width: 150 }} value={filterValue('source')} onChange={(v) => setFilter('source', v)} options={SOURCES} />
        <Select
          allowClear
          placeholder="Access"
          style={{ width: 150 }}
          value={filterValue('entitled')}
          onChange={(v) => setFilter('entitled', v)}
          options={[
            { value: 'true', label: 'Has access' },
            { value: 'false', label: 'No access' },
          ]}
        />
        <LinkedFilters labels={{ user: 'User', status: 'Status' }} filterValue={filterValue} clear={clearLinked} />
      </Space>
      <Table<SubscriptionRow>
        {...tableProps}
        rowKey="id"
        scroll={{ x: 900 }}
        onRow={(row) => ({ onClick: () => void navigate(`/subscriptions/show/${row.id}`), style: { cursor: 'pointer' } })}
      >
        <Table.Column<SubscriptionRow> dataIndex="id" title="#" width={70} />
        <Table.Column<SubscriptionRow> dataIndex="user" title="Subscriber" render={(u: UserCard) => <PersonLink user={u} phone />} />
        <Table.Column<SubscriptionRow> dataIndex="plan" title="Plan" render={(p: SubscriptionRow['plan']) => p.name} />
        <Table.Column<SubscriptionRow> dataIndex="source" title="Source" render={(s: string) => (s === 'google_play' ? 'Google Play' : <Tag color="cyan">complimentary</Tag>)} />
        <Table.Column<SubscriptionRow>
          dataIndex="status"
          title="Status"
          render={(s: string, row) => (
            <Space size={4}>
              <StatusTag value={s} />
              {row.entitled && <Tag color="green">access</Tag>}
            </Space>
          )}
        />
        <Table.Column<SubscriptionRow> dataIndex="expires_at" key="expires_at" title="Ends" sorter render={(v: string | null) => (v ? day(v) : 'never')} />
        <Table.Column<SubscriptionRow> dataIndex="created_at" key="created_at" title="Created" sorter defaultSortOrder="descend" render={day} />
      </Table>
    </List>
  );
}
