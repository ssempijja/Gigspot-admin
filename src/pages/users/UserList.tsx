import { List } from '@refinedev/antd';
import { Input, Select, Space, Table, Typography } from 'antd';
import { useNavigate } from 'react-router';

import { day, StatusTag } from '../../components/format';
import { ExportButton } from '../../components/ExportButton';
import { useAdminTable } from '../../components/useAdminTable';

export interface UserRow {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  verification_status: string;
  is_staff: boolean;
  staff_roles: string[];
  city: string | null;
  date_joined: string;
}

export function UserList() {
  const navigate = useNavigate();
  const { tableProps, setFilter, filterValue, exportQuery } = useAdminTable<UserRow>('users', ['role', 'status', 'verification_status', 'staff', 'search']);

  return (
    <List title="Users" headerButtons={<ExportButton dataset="users" query={exportQuery} />}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Name, email or phone"
          defaultValue={filterValue('search') as string | undefined}
          onSearch={(v) => setFilter('search', v)}
          style={{ width: 260 }}
        />
        <Select
          allowClear
          placeholder="Role"
          style={{ width: 150 }}
          value={filterValue('role')}
          onChange={(v) => setFilter('role', v)}
          options={['client', 'professional', 'company', 'admin'].map((r) => ({ value: r, label: r }))}
        />
        <Select
          allowClear
          placeholder="Account"
          style={{ width: 150 }}
          value={filterValue('status')}
          onChange={(v) => setFilter('status', v)}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
          ]}
        />
        <Select
          allowClear
          placeholder="Verification"
          style={{ width: 160 }}
          value={filterValue('verification_status')}
          onChange={(v) => setFilter('verification_status', v)}
          options={['pending', 'verified', 'rejected'].map((s) => ({ value: s, label: s }))}
        />
      </Space>
      <Table<UserRow>
        {...tableProps}
        rowKey="id"
        scroll={{ x: 900 }}
        onRow={(row) => ({ onClick: () => void navigate(`/users/show/${row.id}`), style: { cursor: 'pointer' } })}
      >
        <Table.Column<UserRow>
          dataIndex="full_name"
          title="Name"
          sorter
          key="first_name"
          render={(name: string, row) => (
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{name}</Typography.Text>
              <Typography.Text type="secondary">{row.email}</Typography.Text>
            </Space>
          )}
        />
        <Table.Column<UserRow> dataIndex="phone_number" title="Phone" />
        <Table.Column<UserRow> dataIndex="role" title="Role" render={(role: string, row) => (row.is_staff ? `${role} (staff)` : role)} />
        <Table.Column<UserRow> dataIndex="is_active" title="Account" render={(active: boolean) => <StatusTag value={active ? 'active' : 'suspended'} />} />
        <Table.Column<UserRow> dataIndex="verification_status" title="Verification" render={(v: string) => <StatusTag value={v} />} />
        <Table.Column<UserRow> dataIndex="city" title="City" />
        <Table.Column<UserRow> dataIndex="date_joined" key="created_at" title="Joined" sorter defaultSortOrder="descend" render={day} />
      </Table>
    </List>
  );
}
