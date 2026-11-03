import { useQuery } from '@tanstack/react-query';
import { Alert, App, Button, Card, Checkbox, Form, Input, Radio, Select, Space, Typography } from 'antd';
import { useState } from 'react';

import { api, ApiError } from '../../api';
import { useCan } from '../../components/ActionButton';
import { PRIORITIES, type Template } from './TemplateList';

interface Values {
  target: 'user' | 'segment';
  user?: string;
  role?: string;
  city?: string;
  verified?: 'any' | 'yes' | 'no';
  listed_professionals?: boolean;
  title: string;
  message: string;
  priority: string;
}

const ROLES = [
  { value: '', label: 'Everyone (clients, professionals, companies)' },
  { value: 'client', label: 'Clients' },
  { value: 'professional', label: 'Professionals' },
  { value: 'company', label: 'Companies' },
];

function payload(v: Values) {
  const base = { title: v.title, message: v.message, priority: v.priority };
  if (v.target === 'user') return { ...base, user: Number(v.user) };
  const segment = {
    ...(v.role ? { role: v.role } : {}),
    ...(v.city?.trim() ? { city: v.city.trim() } : {}),
    ...(v.verified && v.verified !== 'any' ? { verified: v.verified === 'yes' } : {}),
    ...(v.listed_professionals ? { listed_professionals: true } : {}),
  };
  return { ...base, segment };
}

/**
 * Send an in-app notification to one person or a group. A group send counts
 * the recipients first and sends only after the sender confirms that number.
 */
export function SendPage() {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<Values>();
  const target = Form.useWatch('target', form);
  const title = Form.useWatch('title', form) as string | undefined;
  const text = Form.useWatch('message', form) as string | undefined;
  // Sends go out word for word: nothing fills in {placeholders}.
  const placeholder = /\{[^}]*\}/.test(`${title ?? ''} ${text ?? ''}`);
  const [busy, setBusy] = useState(false);
  const canSeeTemplates = useCan('notifications.view');
  const { data: templates = [] } = useQuery({
    queryKey: ['admin-templates-active'],
    enabled: canSeeTemplates,
    queryFn: async () => (await api<Template[]>('/admin/notifications/templates', { query: { limit: 100 } })).data.filter((t) => t.is_active),
  });

  /** Copy a template's wording into the form, to edit before sending. */
  function applyTemplate(id: number) {
    const t = templates.find((x) => x.id === id);
    if (t) form.setFieldsValue({ title: t.title_template, message: t.message_template, priority: t.priority });
  }

  function fail(error: unknown) {
    if (error instanceof ApiError && error.errors) form.setFields(Object.entries(error.errors).map(([name, errors]) => ({ name: name as keyof Values, errors })));
    message.error(error instanceof Error ? error.message : 'Sending failed.');
  }

  async function send(body: Record<string, unknown>) {
    const { data } = await api<{ recipients: number }>('/admin/notifications/send', { method: 'POST', body });
    message.success(`Sent to ${data.recipients} ${data.recipients === 1 ? 'person' : 'people'}.`);
    form.resetFields(['title', 'message']);
  }

  async function submit() {
    let values: Values;
    try {
      values = await form.validateFields();
    } catch {
      return; // the form shows what is missing
    }
    const body = payload(values);
    setBusy(true);
    try {
      if (values.target === 'user') {
        // Name the person, so a mistyped id can't message a stranger unnoticed.
        const { data: person } = await api<{ full_name: string; phone_number: string; role: string }>(`/admin/users/${values.user}`);
        modal.confirm({
          title: `Send this to ${person.full_name} (${person.role}, ${person.phone_number})?`,
          content: values.title,
          okText: 'Send',
          onOk: () => send(body).catch(fail),
        });
        return;
      }
      const { data } = await api<{ recipients: number }>('/admin/notifications/send', { method: 'POST', body: { ...body, dry_run: true } });
      if (data.recipients === 0) {
        message.warning('Nobody matches this group.');
        return;
      }
      modal.confirm({
        title: `Send to ${data.recipients.toLocaleString()} people?`,
        content: 'Everyone in this group gets the notification in the app. This cannot be undone.',
        okText: `Send to ${data.recipients.toLocaleString()}`,
        okButtonProps: { danger: data.recipients > 100 },
        onOk: () => send({ ...body, expected_recipients: data.recipients }).catch(fail),
      });
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 720 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Send a notification
      </Typography.Title>
      <Alert type="info" showIcon message="It appears in the Gigspot app's notifications, from Gigspot. Suspended accounts and staff are never included in a group." />
      <Card>
        <Form<Values> form={form} layout="vertical" initialValues={{ target: 'segment', role: '', verified: 'any', priority: 'medium' }}>
          <Form.Item name="target" label="To">
            <Radio.Group
              options={[
                { value: 'segment', label: 'A group' },
                { value: 'user', label: 'One person' },
              ]}
              optionType="button"
            />
          </Form.Item>
          {target === 'user' ? (
            <Form.Item name="user" label="User id (from their user page)" rules={[{ required: true, pattern: /^\d+$/, message: 'Enter a user id.' }]}>
              <Input style={{ maxWidth: 200 }} />
            </Form.Item>
          ) : (
            <Space wrap align="start">
              <Form.Item name="role" label="Who">
                <Select options={ROLES} style={{ width: 280 }} />
              </Form.Item>
              <Form.Item name="city" label="City (optional)">
                <Input placeholder="Gulu" style={{ width: 160 }} />
              </Form.Item>
              <Form.Item name="verified" label="Identity">
                <Select
                  style={{ width: 160 }}
                  options={[
                    { value: 'any', label: 'Any' },
                    { value: 'yes', label: 'Verified' },
                    { value: 'no', label: 'Not verified' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="listed_professionals" label=" " valuePropName="checked">
                <Checkbox>Listed professionals only</Checkbox>
              </Form.Item>
            </Space>
          )}
          {templates.length > 0 && (
            <Form.Item label="Start from a template (optional)">
              <Select
                allowClear
                placeholder="Choose a template"
                style={{ maxWidth: 360 }}
                options={templates.map((t) => ({ value: t.id, label: t.name }))}
                onChange={(id: number | undefined) => id && applyTemplate(id)}
              />
            </Form.Item>
          )}
          <Form.Item name="title" label="Title" rules={[{ required: true, max: 200 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="message" label="Message" rules={[{ required: true, max: 2000 }]}>
            <Input.TextArea rows={4} showCount maxLength={2000} />
          </Form.Item>
          {placeholder && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="This text has a {placeholder}. Nothing fills it in: replace it with the actual words before sending."
            />
          )}
          <Form.Item name="priority" label="Priority">
            <Select options={PRIORITIES} style={{ width: 160 }} />
          </Form.Item>
          <Button type="primary" loading={busy} onClick={() => void submit()}>
            {target === 'user' ? 'Send' : 'Count recipients and send'}
          </Button>
        </Form>
      </Card>
    </Space>
  );
}
