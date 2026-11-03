import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Card, Space, Table, Tag, Typography } from 'antd';
import { Link } from 'react-router';

import { api } from '../../api';
import { ActionButton } from '../../components/ActionButton';
import { StatusTag, when } from '../../components/format';

interface StaffMember {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_staff: boolean;
  roles: string[];
  totp_enrolled: boolean;
}

interface Enrolment {
  code: string;
  expires_at: string;
}

const ROLES = [
  { value: 'support', label: 'Support: users, bookings, disputes; no money' },
  { value: 'finance', label: 'Finance: refunds, payouts, withdrawals, wallets, plans' },
  { value: 'moderator', label: 'Moderator: reviews and public content' },
  { value: 'viewer', label: 'Viewer: read only' },
  { value: 'super_admin', label: 'Super admin: everything, including staff' },
];

const KEY = ['admin-staff'];

/** Who has a staff role, and enrolment codes for their authenticator. */
export function StaffList() {
  const { modal } = App.useApp();
  const client = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: KEY, queryFn: async () => (await api<StaffMember[]>('/admin/staff')).data });
  const refresh = () => void client.invalidateQueries({ queryKey: KEY });

  /** Shown once: the code is not stored in a readable form. */
  const showEnrolment = (result: unknown) => {
    refresh();
    const enrolment = (result as { enrolment?: Enrolment | null } | null)?.enrolment;
    if (!enrolment) return;
    modal.info({
      title: 'Enrolment code',
      width: 480,
      content: (
        <Space direction="vertical">
          <Typography.Text>Give this code to the person yourself (not by email or chat). They enter it when they first sign in, to set up their authenticator app.</Typography.Text>
          <Typography.Title level={3} copyable style={{ margin: 0, fontFamily: 'monospace' }}>
            {enrolment.code}
          </Typography.Title>
          <Typography.Text type="secondary">Works once, until {when(enrolment.expires_at)}. It won't be shown again.</Typography.Text>
        </Space>
      ),
    });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Staff
        </Typography.Title>
        <ActionButton
          label="Add a staff role"
          title="Give someone a staff role"
          description="They sign in with their own Gigspot account. Someone new to the panel gets an enrolment code for their authenticator app."
          path="/admin/staff"
          pathFor={(v) => `/admin/staff/${String(v.user).trim()}/roles`}
          permission="staff.manage"
          buttonProps={{ type: 'primary' }}
          fields={[
            { name: 'user', label: 'User id (from their user page)', type: 'text', required: true, pattern: /^\d+$/, patternMessage: 'Use digits only.' },
            { name: 'role', label: 'Role', type: 'select', required: true, options: ROLES },
          ]}
          toBody={(v) => ({ role: v.role, reason: v.reason })}
          onDone={showEnrolment}
        />
      </Space>
      {error && <Alert type="error" showIcon message={(error as Error).message} />}
      <Card>
        <Table<StaffMember> dataSource={data} rowKey="id" loading={isLoading} pagination={false} scroll={{ x: 900 }}>
          <Table.Column<StaffMember>
            dataIndex="full_name"
            title="Name"
            render={(name: string, s) => (
              <Space direction="vertical" size={0}>
                <Link to={`/users/show/${s.id}`}>{name || s.email}</Link>
                <Typography.Text type="secondary">{s.email}</Typography.Text>
              </Space>
            )}
          />
          <Table.Column<StaffMember>
            dataIndex="roles"
            title="Roles"
            render={(roles: string[], s) =>
              roles.length ? (
                <Space size={4} wrap>
                  {roles.map((role) => (
                    <ActionButton
                      key={role}
                      label={
                        <>
                          {role.replace('_', ' ')} <span aria-hidden>×</span>
                        </>
                      }
                      title={`Take the ${role.replace('_', ' ')} role from ${s.full_name || s.email}?`}
                      description="With no roles left they stop being staff. At least one super admin always remains."
                      path={`/admin/staff/${s.id}/roles/${role}/revoke`}
                      permission="staff.manage"
                      danger
                      buttonProps={{ size: 'small' }}
                      onDone={refresh}
                    />
                  ))}
                </Space>
              ) : (
                <Tag>legacy staff flag, no role</Tag>
              )
            }
          />
          <Table.Column<StaffMember> dataIndex="is_active" title="Account" render={(a: boolean) => <StatusTag value={a ? 'active' : 'suspended'} />} />
          <Table.Column<StaffMember>
            dataIndex="totp_enrolled"
            title="Authenticator"
            render={(enrolled: boolean) => (enrolled ? <Tag color="green">set up</Tag> : <Tag color="gold">not set up</Tag>)}
          />
          <Table.Column<StaffMember>
            title=""
            render={(_, s) =>
              s.roles.length > 0 && (
                <ActionButton
                  label={s.totp_enrolled ? 'Reset authenticator' : 'New enrolment code'}
                  title={s.totp_enrolled ? 'Reset this authenticator?' : 'Issue a new enrolment code?'}
                  description="For a lost or new phone. Their current authenticator stops working, their panel sessions end, and you get a one-time code for them."
                  path={`/admin/staff/${s.id}/totp/reset`}
                  permission="staff.manage"
                  buttonProps={{ size: 'small' }}
                  onDone={showEnrolment}
                />
              )
            }
          />
        </Table>
      </Card>
    </Space>
  );
}
