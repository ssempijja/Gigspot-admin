import { List } from '@refinedev/antd';
import { useQueryClient } from '@tanstack/react-query';
import { Input, Select, Space, Table, Typography } from 'antd';
import { Link } from 'react-router';

import { ActionButton, type ActionField } from '../../components/ActionButton';
import { day, StatusTag } from '../../components/format';
import { useAdminTable } from '../../components/useAdminTable';

export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  services_count: number;
  postings_count: number;
  created_at: string;
}

function categoryFields(c?: Category): ActionField[] {
  return [
    { name: 'name', label: 'Name', type: 'text', required: true, initial: c?.name },
    { name: 'description', label: 'Description', type: 'textarea', initial: c?.description ?? '' },
    { name: 'icon', label: 'Icon name used by the app (e.g. water, bolt)', type: 'text', initial: c?.icon ?? '' },
    { name: 'is_active', label: 'Shown in the app', type: 'checkbox', initial: c?.is_active ?? true },
  ];
}

const toBody = (v: Record<string, unknown>) => ({
  name: v.name,
  description: String(v.description ?? '').trim(),
  icon: String(v.icon ?? '').trim(),
  is_active: v.is_active === true,
  reason: v.reason,
});

/** The service categories professionals offer and gigs are posted under. */
export function CategoryList() {
  const client = useQueryClient();
  const { tableProps, setFilter, filterValue, tableQuery } = useAdminTable<Category>('categories', ['active', 'search']);
  const refresh = () => {
    void tableQuery.refetch();
    void client.invalidateQueries({ queryKey: ['admin-categories-all'] });
  };

  return (
    <List
      title="Service categories"
      headerButtons={
        <ActionButton
          label="New category"
          title="New service category"
          path="/admin/categories"
          permission="categories.manage"
          buttonProps={{ type: 'primary' }}
          fields={categoryFields()}
          toBody={toBody}
          onDone={refresh}
        />
      }
    >
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search allowClear placeholder="Name or description" defaultValue={filterValue('search') as string | undefined} onSearch={(v) => setFilter('search', v)} style={{ width: 240 }} />
        <Select
          allowClear
          placeholder="Shown"
          style={{ width: 140 }}
          value={filterValue('active')}
          onChange={(v) => setFilter('active', v)}
          options={[
            { value: 'true', label: 'Shown' },
            { value: 'false', label: 'Hidden' },
          ]}
        />
      </Space>
      <Table<Category> {...tableProps} rowKey="id" scroll={{ x: 800 }}>
        <Table.Column<Category>
          dataIndex="name"
          key="name"
          title="Category"
          sorter
          render={(name: string, c) => (
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{name}</Typography.Text>
              {c.description && (
                <Typography.Text type="secondary" ellipsis style={{ maxWidth: 360 }}>
                  {c.description}
                </Typography.Text>
              )}
            </Space>
          )}
        />
        <Table.Column<Category> dataIndex="icon" title="Icon" render={(i: string) => (i ? <Typography.Text code>{i}</Typography.Text> : '—')} />
        <Table.Column<Category> dataIndex="is_active" title="State" render={(a: boolean) => <StatusTag value={a ? 'active' : 'closed'} />} />
        <Table.Column<Category>
          dataIndex="services_count"
          title="Services"
          render={(n: number, c) => (n ? <Link to={`/professionals?category=${c.id}`}>{n}</Link> : 0)}
        />
        <Table.Column<Category>
          dataIndex="postings_count"
          title="Postings"
          render={(n: number, c) => (n ? <Link to={`/postings?category=${c.id}`}>{n}</Link> : 0)}
        />
        <Table.Column<Category> dataIndex="created_at" key="created_at" title="Added" sorter render={day} />
        <Table.Column<Category>
          title=""
          render={(_, c) => (
            <Space>
              <ActionButton
                label="Edit"
                title={`Edit ${c.name}`}
                method="PATCH"
                path={`/admin/categories/${c.id}`}
                permission="categories.manage"
                buttonProps={{ size: 'small' }}
                fields={categoryFields(c)}
                toBody={toBody}
                onDone={refresh}
              />
              {c.services_count === 0 && c.postings_count === 0 && (
                <ActionButton
                  label="Delete"
                  title={`Delete ${c.name}?`}
                  description="Nothing uses it, so it can go for good. A category in use can only be hidden."
                  method="DELETE"
                  path={`/admin/categories/${c.id}`}
                  permission="categories.manage"
                  danger
                  buttonProps={{ size: 'small' }}
                  onDone={refresh}
                />
              )}
            </Space>
          )}
        />
      </Table>
    </List>
  );
}
