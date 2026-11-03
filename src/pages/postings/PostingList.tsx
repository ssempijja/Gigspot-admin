import { List } from '@refinedev/antd';
import { Input, Select, Space, Table, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router';

import { ExportButton } from '../../components/ExportButton';
import { day, PersonLink, StatusTag, ugx, type UserCard } from '../../components/format';
import { LinkedFilters } from '../../components/LinkedFilters';
import { useAdminTable } from '../../components/useAdminTable';
import { useCategories } from '../professionals/ProfessionalList';

export interface PostingRow {
  id: number;
  posting_type: 'gig' | 'job';
  title: string;
  status: string;
  client: UserCard;
  category: { id: number; name: string } | null;
  city: string;
  budget_min: string | null;
  budget_max: string | null;
  quotes_count: number;
  applications_count: number;
  booking_id: number | null;
  expires_at: string | null;
  created_at: string;
}

const STATUSES = ['pending', 'quoted', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed'];

export function budget(p: Pick<PostingRow, 'budget_min' | 'budget_max'>) {
  if (p.budget_min && p.budget_max) return `${ugx(p.budget_min)} – ${ugx(p.budget_max).replace('UGX ', '')}`;
  if (p.budget_max) return `up to ${ugx(p.budget_max)}`;
  if (p.budget_min) return `from ${ugx(p.budget_min)}`;
  return '—';
}

/** Gigs (clients asking for quotes) and company jobs (taking applications). */
export function PostingList() {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const { tableProps, setFilter, filterValue, exportQuery, clearLinked } = useAdminTable<PostingRow>('postings', [
    'posting_type',
    'status',
    'category',
    'client',
    'search',
  ]);

  return (
    <List title="Gigs and jobs" headerButtons={<ExportButton dataset="postings" query={exportQuery} />}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Title, description or place"
          defaultValue={filterValue('search') as string | undefined}
          onSearch={(v) => setFilter('search', v)}
          style={{ width: 240 }}
        />
        <Select
          allowClear
          placeholder="Kind"
          style={{ width: 130 }}
          value={filterValue('posting_type')}
          onChange={(v) => setFilter('posting_type', v)}
          options={[
            { value: 'gig', label: 'Gigs' },
            { value: 'job', label: 'Company jobs' },
          ]}
        />
        <Select allowClear placeholder="Status" style={{ width: 150 }} value={filterValue('status')} onChange={(v) => setFilter('status', v)} options={STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))} />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Category"
          style={{ width: 170 }}
          value={filterValue('category')}
          onChange={(v) => setFilter('category', v)}
          options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
        />
        <LinkedFilters labels={{ client: 'Posted by user' }} filterValue={filterValue} clear={clearLinked} />
      </Space>
      <Table<PostingRow>
        {...tableProps}
        rowKey="id"
        scroll={{ x: 1000 }}
        onRow={(row) => ({ onClick: () => void navigate(`/postings/show/${row.id}`), style: { cursor: 'pointer' } })}
      >
        <Table.Column<PostingRow> dataIndex="id" title="#" width={70} />
        <Table.Column<PostingRow>
          dataIndex="title"
          key="title"
          title="Posting"
          sorter
          render={(title: string, p) => (
            <Space direction="vertical" size={0}>
              <Space size={4}>
                <Typography.Text strong>{title}</Typography.Text>
                {p.posting_type === 'job' && <Tag color="purple">job</Tag>}
              </Space>
              <Typography.Text type="secondary">
                {[p.category?.name, p.city].filter(Boolean).join(' · ') || '—'}
              </Typography.Text>
            </Space>
          )}
        />
        <Table.Column<PostingRow> dataIndex="client" title="Posted by" render={(u: UserCard) => <PersonLink user={u} />} />
        <Table.Column<PostingRow> dataIndex="status" title="Status" render={(s: string) => <StatusTag value={s} />} />
        <Table.Column<PostingRow> title="Budget" render={(_, p) => budget(p)} />
        <Table.Column<PostingRow>
          title="Responses"
          render={(_, p) => (p.posting_type === 'job' ? `${p.applications_count} applications` : `${p.quotes_count} quotes`)}
        />
        <Table.Column<PostingRow> dataIndex="expires_at" key="expires_at" title="Closes" sorter render={day} />
        <Table.Column<PostingRow> dataIndex="created_at" key="created_at" title="Posted" sorter defaultSortOrder="descend" render={day} />
      </Table>
    </List>
  );
}
