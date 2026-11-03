import { List } from '@refinedev/antd';
import { useQuery } from '@tanstack/react-query';
import { Input, Select, Space, Table, Tag } from 'antd';
import { useNavigate } from 'react-router';

import { api } from '../../api';
import { ExportButton } from '../../components/ExportButton';
import { day, PersonLink, ugx, type UserCard } from '../../components/format';
import { useAdminTable } from '../../components/useAdminTable';
import type { Category } from '../categories/CategoryList';

export interface ProfessionalRow {
  id: number;
  user: UserCard;
  city: string | null;
  is_verified: boolean;
  listed: boolean;
  is_active: boolean;
  is_featured: boolean;
  featured_until: string | null;
  availability_status: boolean;
  average_rating: string;
  total_jobs_completed: number;
  total_earnings: string;
  services_count: number;
  created_at: string;
}

const yesNo = (yes: string, no: string) => [
  { value: 'true', label: yes },
  { value: 'false', label: no },
];

/** Every category, for filters and pickers (a short list). */
export function useCategories() {
  return useQuery({
    queryKey: ['admin-categories-all'],
    queryFn: async () => (await api<Category[]>('/admin/categories', { query: { limit: 100 } })).data,
    staleTime: 60_000,
  });
}

export function ProfessionalList() {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const { tableProps, setFilter, filterValue, exportQuery } = useAdminTable<ProfessionalRow>('professionals', [
    'verified',
    'listed',
    'featured',
    'category',
    'city',
    'search',
  ]);

  return (
    <List title="Professionals" headerButtons={<ExportButton dataset="professionals" query={exportQuery} />}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Name, phone, bio or service"
          defaultValue={filterValue('search') as string | undefined}
          onSearch={(v) => setFilter('search', v)}
          style={{ width: 240 }}
        />
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
        <Input.Search allowClear placeholder="City" defaultValue={filterValue('city') as string | undefined} onSearch={(v) => setFilter('city', v.trim())} style={{ width: 140 }} />
        <Select allowClear placeholder="Identity" style={{ width: 140 }} value={filterValue('verified')} onChange={(v) => setFilter('verified', v)} options={yesNo('Verified', 'Not verified')} />
        <Select allowClear placeholder="Listing" style={{ width: 140 }} value={filterValue('listed')} onChange={(v) => setFilter('listed', v)} options={yesNo('Listed', 'Not listed')} />
        <Select allowClear placeholder="Featured" style={{ width: 140 }} value={filterValue('featured')} onChange={(v) => setFilter('featured', v)} options={yesNo('Featured', 'Not featured')} />
      </Space>
      <Table<ProfessionalRow>
        {...tableProps}
        rowKey="id"
        scroll={{ x: 1000 }}
        onRow={(row) => ({ onClick: () => void navigate(`/professionals/show/${row.id}`), style: { cursor: 'pointer' } })}
      >
        <Table.Column<ProfessionalRow> dataIndex="user" title="Professional" render={(u: UserCard) => <PersonLink user={u} phone />} />
        <Table.Column<ProfessionalRow> dataIndex="city" title="City" render={(c: string | null) => c || '—'} />
        <Table.Column<ProfessionalRow>
          title="State"
          render={(_, p) => (
            <Space size={4} wrap>
              {p.listed ? <Tag color="green">listed</Tag> : <Tag>not listed</Tag>}
              {p.is_verified && <Tag color="blue">verified</Tag>}
              {p.is_featured && <Tag color="gold">featured</Tag>}
              {!p.is_active && <Tag color="red">suspended</Tag>}
            </Space>
          )}
        />
        <Table.Column<ProfessionalRow> dataIndex="average_rating" key="rating" title="Rating" sorter render={(r: string) => Number(r).toFixed(1)} />
        <Table.Column<ProfessionalRow> dataIndex="total_jobs_completed" key="jobs" title="Jobs done" sorter />
        <Table.Column<ProfessionalRow> dataIndex="total_earnings" key="earnings" title="Earned" sorter render={ugx} />
        <Table.Column<ProfessionalRow> dataIndex="services_count" title="Services" />
        <Table.Column<ProfessionalRow> dataIndex="created_at" key="created_at" title="Joined" sorter defaultSortOrder="descend" render={day} />
      </Table>
    </List>
  );
}
