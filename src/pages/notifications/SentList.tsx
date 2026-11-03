import { List } from '@refinedev/antd';
import { Space, Table, Tag, Typography } from 'antd';
import { Link } from 'react-router';

import { when } from '../../components/format';
import { useAdminTable } from '../../components/useAdminTable';

interface Sent {
  id: number;
  sent_by: string;
  sent_at: string;
  user_id: number | null;
  segment: Record<string, unknown> | null;
  recipients: number | null;
  title: string | null;
  message: string | null;
  priority: string | null;
}

function audience(s: Sent) {
  if (s.user_id) return <Link to={`/users/show/${s.user_id}`}>User #{s.user_id}</Link>;
  const parts = Object.entries(s.segment ?? {}).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${String(v)}`);
  return parts.length ? parts.join(', ') : 'Everyone';
}

/** Notifications staff sent, newest first. */
export function SentList() {
  const { tableProps } = useAdminTable<Sent>('sent-notifications', [], 'notifications/sent');

  return (
    <List title="Sent notifications">
      <Table<Sent> {...tableProps} rowKey="id" scroll={{ x: 900 }}>
        <Table.Column<Sent> dataIndex="sent_at" title="When" render={when} />
        <Table.Column<Sent>
          dataIndex="title"
          title="Notification"
          render={(title: string | null, s) => (
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{title}</Typography.Text>
              <Typography.Paragraph type="secondary" ellipsis={{ rows: 2, expandable: true }} style={{ margin: 0, maxWidth: 420 }}>
                {s.message}
              </Typography.Paragraph>
            </Space>
          )}
        />
        <Table.Column<Sent> title="To" render={(_, s) => audience(s)} />
        <Table.Column<Sent> dataIndex="recipients" title="People" />
        <Table.Column<Sent> dataIndex="priority" title="Priority" render={(p: string | null) => (p ? <Tag>{p}</Tag> : '—')} />
        <Table.Column<Sent> dataIndex="sent_by" title="Sent by" />
      </Table>
    </List>
  );
}
