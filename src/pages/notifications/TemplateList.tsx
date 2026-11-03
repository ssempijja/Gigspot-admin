import { List } from '@refinedev/antd';
import { Input, Space, Table, Tag, Typography } from 'antd';

import { ActionButton, type ActionField } from '../../components/ActionButton';
import { day, StatusTag } from '../../components/format';
import { useAdminTable } from '../../components/useAdminTable';

export interface Template {
  id: number;
  name: string;
  notification_type: string;
  title_template: string;
  message_template: string;
  priority: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TYPES = [
  'system',
  'job_request',
  'job_quote',
  'job_application',
  'job_booking',
  'job_completed',
  'booking_confirmed',
  'booking_cancelled',
  'payment_received',
  'payment_sent',
  'review_received',
  'message',
  'message_received',
  'verification_approved',
  'verification_rejected',
  'withdrawal_approved',
  'withdrawal_rejected',
  'dispute_created',
  'dispute_resolved',
];
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'].map((p) => ({ value: p, label: p }));

function templateFields(t?: Template): ActionField[] {
  return [
    { name: 'name', label: 'Name', type: 'text', required: true, initial: t?.name },
    { name: 'notification_type', label: 'Type', type: 'select', required: true, options: TYPES.map((v) => ({ value: v, label: v.replace(/_/g, ' ') })), initial: t?.notification_type ?? 'system' },
    { name: 'title_template', label: 'Title', type: 'text', required: true, initial: t?.title_template },
    { name: 'message_template', label: 'Message', type: 'textarea', required: true, initial: t?.message_template },
    { name: 'priority', label: 'Priority', type: 'select', required: true, options: PRIORITIES, initial: t?.priority ?? 'medium' },
    { name: 'is_active', label: 'In use', type: 'checkbox', initial: t?.is_active ?? true },
  ];
}

const toBody = (v: Record<string, unknown>) => ({ ...v, is_active: v.is_active === true });

export function TemplateList() {
  const { tableProps, setFilter, filterValue, tableQuery } = useAdminTable<Template>('templates', ['search'], 'notifications/templates');
  const refresh = () => void tableQuery.refetch();

  return (
    <List
      title="Notification templates"
      headerButtons={
        <ActionButton
          label="New template"
          title="New notification template"
          path="/admin/notifications/templates"
          permission="notifications.send"
          reason={false}
          buttonProps={{ type: 'primary' }}
          fields={templateFields()}
          toBody={toBody}
          onDone={refresh}
        />
      }
    >
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search allowClear placeholder="Name or title" defaultValue={filterValue('search') as string | undefined} onSearch={(v) => setFilter('search', v)} style={{ width: 240 }} />
      </Space>
      <Table<Template> {...tableProps} rowKey="id" scroll={{ x: 900 }}>
        <Table.Column<Template> dataIndex="name" key="name" title="Name" sorter render={(n: string) => <Typography.Text strong>{n}</Typography.Text>} />
        <Table.Column<Template>
          dataIndex="title_template"
          title="Notification"
          render={(title: string, t) => (
            <Space direction="vertical" size={0}>
              <Typography.Text>{title}</Typography.Text>
              <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: 0, maxWidth: 420 }}>
                {t.message_template}
              </Typography.Paragraph>
            </Space>
          )}
        />
        <Table.Column<Template> dataIndex="notification_type" title="Type" render={(v: string) => <Tag>{v.replace(/_/g, ' ')}</Tag>} />
        <Table.Column<Template> dataIndex="priority" title="Priority" />
        <Table.Column<Template> dataIndex="is_active" title="State" render={(a: boolean) => <StatusTag value={a ? 'active' : 'closed'} />} />
        <Table.Column<Template> dataIndex="updated_at" title="Changed" render={day} />
        <Table.Column<Template>
          title=""
          render={(_, t) => (
            <ActionButton
              label="Edit"
              title={`Edit "${t.name}"`}
              method="PATCH"
              path={`/admin/notifications/templates/${t.id}`}
              permission="notifications.send"
              reason={false}
              fields={templateFields(t)}
              toBody={toBody}
              onDone={refresh}
            />
          )}
        />
      </Table>
    </List>
  );
}
