import { useQuery } from '@tanstack/react-query';
import { App, Button, Checkbox, Form, Input, Modal, Select, type ButtonProps } from 'antd';
import { useState, type ReactNode } from 'react';

import { api, ApiError } from '../api';
import { getMe } from '../providers';

/**
 * A button that opens a form for an admin action, sends it, and reports the
 * outcome. Every action asks for a reason (recorded in the audit log) unless
 * [reason] is false. Shown only to staff with [permission].
 */

export type ActionField =
  | { name: string; label: string; type: 'text' | 'textarea'; required?: boolean; placeholder?: string; initial?: string; pattern?: RegExp; patternMessage?: string }
  | { name: string; label: string; type: 'select'; options: { value: string; label: string }[]; required?: boolean; initial?: string }
  | { name: string; label: string; type: 'checkbox'; initial?: boolean; help?: string };

interface Props {
  label: ReactNode;
  title: string;
  path: string;
  /** Build the path from the form values instead (e.g. a user id typed into the form). */
  pathFor?: (values: Record<string, unknown>) => string;
  method?: 'POST' | 'PATCH' | 'DELETE';
  permission?: string;
  fields?: ActionField[];
  /** Asks for a reason (default); the API requires one for most actions. */
  reason?: boolean;
  /** Extra text shown above the form (what will happen). */
  description?: ReactNode;
  confirmText?: string;
  danger?: boolean;
  buttonProps?: ButtonProps;
  /** Turn the form values into the request body (e.g. numbers, nested objects). */
  toBody?: (values: Record<string, unknown>) => Record<string, unknown>;
  onDone?: (data: unknown) => void;
}

export function useMe() {
  return useQuery({ queryKey: ['admin-me'], queryFn: getMe, staleTime: 60_000 });
}

/** Whether the signed-in staff member holds [permission]. */
export function useCan(permission?: string): boolean {
  const { data } = useMe();
  return !permission || !!data?.permissions.includes(permission);
}

export function ActionButton(props: Props) {
  const { message } = App.useApp();
  const can = useCan(props.permission);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm();
  if (!can) return null;
  const fields = props.fields ?? [];
  const askReason = props.reason !== false;

  async function submit() {
    let values: Record<string, unknown>;
    try {
      values = (await form.validateFields()) as Record<string, unknown>;
    } catch {
      return; // the form shows what is missing
    }
    setBusy(true);
    try {
      const body = props.toBody ? props.toBody(values) : values;
      const { data } = await api(props.pathFor ? props.pathFor(values) : props.path, { method: props.method ?? 'POST', body });
      message.success('Done.');
      setOpen(false);
      form.resetFields();
      props.onDone?.(data);
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        form.setFields(Object.entries(error.errors).map(([name, errors]) => ({ name, errors })));
      }
      message.error(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  const initial = Object.fromEntries(fields.filter((f) => f.initial !== undefined).map((f) => [f.name, f.initial]));

  return (
    <>
      <Button danger={props.danger} {...props.buttonProps} onClick={() => setOpen(true)}>
        {props.label}
      </Button>
      <Modal
        open={open}
        title={props.title}
        okText={props.confirmText ?? 'Confirm'}
        okButtonProps={{ danger: props.danger, loading: busy }}
        onOk={() => void submit()}
        onCancel={() => setOpen(false)}
        destroyOnHidden
      >
        {props.description && <div style={{ marginBottom: 16 }}>{props.description}</div>}
        <Form form={form} layout="vertical" initialValues={initial} preserve={false}>
          {fields.map((field) => {
            if (field.type === 'checkbox') {
              return (
                <Form.Item key={field.name} name={field.name} valuePropName="checked" extra={field.help}>
                  <Checkbox>{field.label}</Checkbox>
                </Form.Item>
              );
            }
            const rules = [
              ...(field.required ? [{ required: true, message: `${field.label} is required.` }] : []),
              ...(field.type !== 'select' && field.pattern ? [{ pattern: field.pattern, message: field.patternMessage ?? 'Check this value.' }] : []),
            ];
            return (
              <Form.Item key={field.name} name={field.name} label={field.label} rules={rules}>
                {field.type === 'select' ? (
                  <Select options={field.options} />
                ) : field.type === 'textarea' ? (
                  <Input.TextArea rows={3} placeholder={field.placeholder} />
                ) : (
                  <Input placeholder={field.placeholder} />
                )}
              </Form.Item>
            );
          })}
          {askReason && (
            <Form.Item
              name="reason"
              label="Reason (recorded in the audit log)"
              rules={[{ required: true, min: 3, message: 'Give a reason (at least 3 characters).' }]}
            >
              <Input.TextArea rows={2} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
