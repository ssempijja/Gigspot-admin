import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Card, Col, Descriptions, Image, Row, Skeleton, Space, Table, Tag, Typography } from 'antd';
import { Link, useParams } from 'react-router';

import { api } from '../../api';
import { ActionButton } from '../../components/ActionButton';
import { AuditHistoryLink, PermittedLink } from '../../components/PermittedLink';
import { day, StatusTag, ugx, when } from '../../components/format';
import type { UserRow } from './UserList';

interface Document {
  id: number;
  document_type: string;
  url: string | null;
  is_verified: boolean;
  rejection_reason: string | null;
  created_at: string;
}

interface UserDetail extends UserRow {
  nin: string | null;
  date_of_birth: string | null;
  address: string | null;
  district: string | null;
  profile_picture: string | null;
  emergency_contact: { name: string | null; phone: string | null };
  documents: Document[];
  company_profile: { company_name: string; registration_number: string; business_type: string; city: string; is_verified: boolean } | null;
  professional_profile: { id: number; average_rating: string; total_jobs_completed: number; total_earnings: string } | null;
  subscription: { plan: string; status: string; expires_at: string | null } | null;
  counts: { bookings_as_client: number; bookings_as_professional: number; postings: number; reviews_received: number; payments_total: string };
  recent_bookings: { id: number; title: string; status: string; payment_status: string; total_amount: string | null; created_at: string }[];
  last_login: string | null;
}

export function UserShow() {
  const { id } = useParams();
  const client = useQueryClient();
  const key = ['admin-user', id];
  const { data: user, isLoading, error } = useQuery({ queryKey: key, queryFn: async () => (await api<UserDetail>(`/admin/users/${id}`)).data });
  const refresh = () => void client.invalidateQueries({ queryKey: key });

  if (error) return <Alert type="error" showIcon message={(error as Error).message} />;
  if (isLoading || !user) return <Skeleton active />;
  const base = `/admin/users/${user.id}`;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
        <Space align="center">
          {user.profile_picture && <Image src={user.profile_picture} width={48} height={48} style={{ borderRadius: 24, objectFit: 'cover' }} />}
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {user.full_name}
            </Typography.Title>
            <Space size={4}>
              <Tag>{user.role}</Tag>
              <StatusTag value={user.is_active ? 'active' : 'suspended'} />
              <StatusTag value={user.verification_status} />
              {user.staff_roles.map((r) => (
                <Tag key={r} color="geekblue">
                  {r.replace('_', ' ')}
                </Tag>
              ))}
            </Space>
          </div>
        </Space>
        <Space wrap>
          {user.professional_profile && (
            <PermittedLink to={`/wallets/show/${user.id}`} permission="payments.view">
              Wallet
            </PermittedLink>
          )}
          <PermittedLink to={`/transactions?user=${user.id}`} permission="payments.view">
            Payments
          </PermittedLink>
          <AuditHistoryLink type="User" id={user.id} />
          <ActionButton
            label="Edit contact details"
            title={`Edit ${user.full_name}`}
            path={base}
            method="PATCH"
            permission="users.edit"
            fields={[
              { name: 'first_name', label: 'First name', type: 'text', initial: user.full_name.split(' ')[0] },
              { name: 'email', label: 'Email', type: 'text', initial: user.email },
              { name: 'phone_number', label: 'Phone number', type: 'text', initial: user.phone_number },
              { name: 'city', label: 'City', type: 'text', initial: user.city ?? '' },
            ]}
            onDone={refresh}
          />
          {user.is_active ? (
            <ActionButton
              danger
              label="Suspend"
              title={`Suspend ${user.full_name}?`}
              description="They are signed out at once and can't sign in until reactivated."
              path={`${base}/suspend`}
              permission="users.suspend"
              onDone={refresh}
            />
          ) : (
            <ActionButton label="Reactivate" title={`Reactivate ${user.full_name}?`} path={`${base}/reactivate`} permission="users.suspend" onDone={refresh} />
          )}
          <ActionButton
            label="Change role"
            title="Change role"
            path={`${base}/role`}
            permission="users.role"
            fields={[
              {
                name: 'role',
                label: 'New role',
                type: 'select',
                required: true,
                options: ['client', 'professional', 'company'].map((r) => ({ value: r, label: r })),
              },
            ]}
            onDone={refresh}
          />
        </Space>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Profile">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Email">{user.email || '—'}</Descriptions.Item>
              <Descriptions.Item label="Phone">{user.phone_number}</Descriptions.Item>
              <Descriptions.Item label="NIN">{user.nin ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Born">{day(user.date_of_birth)}</Descriptions.Item>
              <Descriptions.Item label="Address">{[user.address, user.city, user.district].filter(Boolean).join(', ') || '—'}</Descriptions.Item>
              <Descriptions.Item label="Emergency contact">
                {user.emergency_contact.name ? `${user.emergency_contact.name} (${user.emergency_contact.phone ?? '—'})` : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Joined">{day(user.date_joined)}</Descriptions.Item>
              <Descriptions.Item label="Last sign-in">{when(user.last_login)}</Descriptions.Item>
              <Descriptions.Item label="Subscription">
                {user.subscription ? `${user.subscription.plan} (${user.subscription.status})` : 'None'}
              </Descriptions.Item>
              {user.professional_profile && (
                <Descriptions.Item label="As professional">
                  {user.professional_profile.total_jobs_completed} jobs, rating {user.professional_profile.average_rating}, earned {ugx(user.professional_profile.total_earnings)}
                </Descriptions.Item>
              )}
              {user.company_profile && (
                <Descriptions.Item label="Company">
                  {user.company_profile.company_name} · reg. {user.company_profile.registration_number}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Activity">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Bookings as client">{user.counts.bookings_as_client}</Descriptions.Item>
              <Descriptions.Item label="Bookings as professional">{user.counts.bookings_as_professional}</Descriptions.Item>
              <Descriptions.Item label="Postings">{user.counts.postings}</Descriptions.Item>
              <Descriptions.Item label="Reviews received">{user.counts.reviews_received}</Descriptions.Item>
              <Descriptions.Item label="Paid in total">{ugx(user.counts.payments_total)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card
        title="Identity documents"
        extra={
          <Space>
            <ActionButton
              label="Approve identity"
              title="Approve this person's identity?"
              description="All their documents are marked verified; a professional becomes listed."
              path={`${base}/verification`}
              permission="users.verify"
              reason={false}
              toBody={() => ({ decision: 'approve' })}
              buttonProps={{ type: 'primary' }}
              onDone={refresh}
            />
            <ActionButton
              danger
              label="Reject"
              title="Reject verification"
              description="The user is told the reason and can upload new documents."
              path={`${base}/verification`}
              permission="users.verify"
              toBody={(v) => ({ decision: 'reject', reason: v.reason })}
              onDone={refresh}
            />
          </Space>
        }
      >
        <Table<Document> dataSource={user.documents} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }}>
          <Table.Column<Document> dataIndex="document_type" title="Type" render={(t: string) => t.replace(/_/g, ' ')} />
          <Table.Column<Document>
            dataIndex="url"
            title="File"
            render={(url: string | null) =>
              url ? (
                <a href={url} target="_blank" rel="noreferrer">
                  Open
                </a>
              ) : (
                '—'
              )
            }
          />
          <Table.Column<Document>
            title="Status"
            render={(_, d) => (d.is_verified ? <StatusTag value="verified" /> : d.rejection_reason ? <Tag color="red">rejected: {d.rejection_reason}</Tag> : <StatusTag value="pending" />)}
          />
          <Table.Column<Document>
            title=""
            render={(_, d) => (
              <Space>
                <ActionButton
                  label="Approve"
                  title="Approve this document?"
                  path={`${base}/documents/${d.id}/review`}
                  permission="users.verify"
                  reason={false}
                  toBody={() => ({ decision: 'approve' })}
                  buttonProps={{ size: 'small' }}
                  onDone={refresh}
                />
                <ActionButton
                  danger
                  label="Reject"
                  title="Reject this document"
                  path={`${base}/documents/${d.id}/review`}
                  permission="users.verify"
                  toBody={(v) => ({ decision: 'reject', reason: v.reason })}
                  buttonProps={{ size: 'small' }}
                  onDone={refresh}
                />
              </Space>
            )}
          />
        </Table>
      </Card>

      <Card title="Recent bookings">
        <Table dataSource={user.recent_bookings} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }}>
          <Table.Column dataIndex="title" title="Booking" render={(t: string, b: { id: number }) => <Link to={`/bookings/show/${b.id}`}>{t}</Link>} />
          <Table.Column dataIndex="status" title="Status" render={(s: string) => <StatusTag value={s} />} />
          <Table.Column dataIndex="payment_status" title="Payment" render={(s: string) => <StatusTag value={s} />} />
          <Table.Column dataIndex="total_amount" title="Total" render={ugx} />
          <Table.Column dataIndex="created_at" title="Created" render={day} />
        </Table>
      </Card>
    </Space>
  );
}
