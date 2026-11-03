import { List } from '@refinedev/antd';
import { Input, Select, Space, Table, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router';

import { StatusTag, when } from '../../components/format';
import { useAdminTable } from '../../components/useAdminTable';

export interface CrashGroup {
  id: number;
  kind: string;
  title: string;
  top_frame: string;
  status: string;
  occurrences: number;
  first_version: string;
  last_version: string;
  first_seen: string;
  last_seen: string;
}

interface Row extends CrashGroup {
  crashes_in_range: number;
  people: number;
}

const STATUSES = ['open', 'resolved', 'ignored'];
const KINDS = [
  { value: 'flutter', label: 'Flutter' },
  { value: 'dart', label: 'Dart' },
  { value: 'native', label: 'Android/iOS' },
  { value: 'anr', label: 'Not responding' },
];

/** Crashes grouped by where in the code they happen. */
export function CrashList() {
  const navigate = useNavigate();
  const { tableProps, setFilter, filterValue } = useAdminTable<Row>('telemetry-crashes', ['status', 'kind', 'version', 'search'], 'telemetry/crashes');

  return (
    <List title="Crashes">
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search allowClear placeholder="Message or code location" defaultValue={filterValue('search') as string | undefined} onSearch={(v) => setFilter('search', v)} style={{ width: 260 }} />
        <Select allowClear placeholder="Status" style={{ width: 140 }} value={filterValue('status')} onChange={(v) => setFilter('status', v)} options={STATUSES.map((s) => ({ value: s, label: s }))} />
        <Select allowClear placeholder="Kind" style={{ width: 160 }} value={filterValue('kind')} onChange={(v) => setFilter('kind', v)} options={KINDS} />
        <Input.Search allowClear placeholder="App version, e.g. 1.5.0" defaultValue={filterValue('version') as string | undefined} onSearch={(v) => setFilter('version', v.trim())} style={{ width: 200 }} />
      </Space>
      <Table<Row>
        {...tableProps}
        rowKey="id"
        scroll={{ x: 1000 }}
        onRow={(row) => ({ onClick: () => void navigate(`/app/crashes/show/${row.id}`), style: { cursor: 'pointer' } })}
      >
        <Table.Column<Row>
          dataIndex="title"
          title="Crash"
          render={(title: string, c) => (
            <Space direction="vertical" size={0}>
              <Typography.Text strong ellipsis style={{ maxWidth: 460 }}>
                {title}
              </Typography.Text>
              <Typography.Text type="secondary" code ellipsis style={{ maxWidth: 460 }}>
                {c.top_frame || '—'}
              </Typography.Text>
            </Space>
          )}
        />
        <Table.Column<Row> dataIndex="kind" title="Kind" render={(k: string) => <Tag>{KINDS.find((x) => x.value === k)?.label ?? k}</Tag>} />
        <Table.Column<Row> dataIndex="crashes_in_range" title="Last 30 days" />
        <Table.Column<Row> dataIndex="people" title="People" />
        <Table.Column<Row> dataIndex="occurrences" key="occurrences" title="All time" sorter />
        <Table.Column<Row> dataIndex="last_version" title="Latest version" />
        <Table.Column<Row> dataIndex="status" title="Status" render={(s: string) => <StatusTag value={s} />} />
        <Table.Column<Row> dataIndex="last_seen" key="last_seen" title="Last seen" sorter defaultSortOrder="descend" render={when} />
      </Table>
    </List>
  );
}
