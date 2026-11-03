import { Card, Col, Descriptions, Empty, Image, Row, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useParams } from 'react-router';

import { ActionButton } from '../../components/ActionButton';
import { DetailHeader, DetailState, useDetail } from '../../components/Detail';
import { day, PersonLink, StatusTag, ugx, when } from '../../components/format';
import { AuditHistoryLink, PermittedLink } from '../../components/PermittedLink';
import type { ProfessionalRow } from './ProfessionalList';

interface Service {
  id: number;
  service_name: string;
  category: { id: number; name: string };
  base_price: string | null;
  is_active: boolean;
}

interface Document {
  id: number;
  document_type: string;
  title: string;
  url: string | null;
  is_verified: boolean;
  rejection_reason: string | null;
  verified_at: string | null;
  created_at: string;
}

interface PortfolioItem {
  id: number;
  title: string;
  image: string | null;
  is_featured: boolean;
  created_at: string;
}

interface ProfessionalDetail extends ProfessionalRow {
  bio: string;
  experience_level: string | null;
  years_of_experience: number | null;
  hourly_rate: string | null;
  service_areas: unknown;
  services: Service[];
  documents: Document[];
  portfolio: PortfolioItem[];
  subscription: { plan: string; status: string; expires_at: string | null } | null;
  counts: { completed_bookings: number; open_disputes: number };
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function documentState(d: Document) {
  if (d.is_verified) return <StatusTag value="approved" />;
  if (d.rejection_reason) return <StatusTag value="rejected" />;
  return <StatusTag value="pending" />;
}

export function ProfessionalShow() {
  const { id } = useParams();
  const { data, error, isLoading, refresh } = useDetail<ProfessionalDetail>(`/admin/professionals/${id}`);

  return (
    <DetailState data={data} error={error} isLoading={isLoading}>
      {(p) => {
        const base = `/admin/professionals/${p.id}`;
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <DetailHeader
              title={p.user.full_name}
              tags={
                <>
                  {p.listed ? <Tag color="green">listed</Tag> : <Tag>not listed</Tag>}
                  {p.is_verified && <Tag color="blue">identity verified</Tag>}
                  {p.is_featured && <Tag color="gold">featured{p.featured_until && ` through ${day(p.featured_until)}`}</Tag>}
                  {!p.availability_status && <Tag>unavailable</Tag>}
                  {!p.is_active && <Tag color="red">suspended</Tag>}
                </>
              }
              actions={
                <>
                  <PermittedLink to={`/users/show/${p.user.id}`} permission="users.view">
                    Account
                  </PermittedLink>
                  <PermittedLink to={`/wallets/show/${p.user.id}`} permission="payments.view">
                    Wallet
                  </PermittedLink>
                  <AuditHistoryLink type="ProfessionalProfile" id={p.id} />
                  <ActionButton
                    label="Edit listing"
                    title="Listing and featuring"
                    description="Listed: shows in client search. Featured: shown first, until the date you give (empty: until you turn it off)."
                    method="PATCH"
                    path={base}
                    permission="professionals.edit"
                    fields={[
                      { name: 'listed', label: 'Listed in search', type: 'checkbox', initial: p.listed },
                      { name: 'is_featured', label: 'Featured', type: 'checkbox', initial: p.is_featured },
                      {
                        name: 'featured_until',
                        label: 'Featured through (YYYY-MM-DD, optional)',
                        type: 'text',
                        initial: p.featured_until ? dayjs(p.featured_until).format('YYYY-MM-DD') : '',
                      },
                      { name: 'availability_status', label: 'Available for work', type: 'checkbox', initial: p.availability_status },
                    ]}
                    toBody={(v) => {
                      const until = String(v.featured_until ?? '').trim();
                      if (until && !DATE.test(until)) throw new Error('Write the date as YYYY-MM-DD.');
                      return {
                        listed: v.listed === true,
                        is_featured: v.is_featured === true,
                        featured_until: v.is_featured === true && until ? dayjs(until).endOf('day').toISOString() : null,
                        availability_status: v.availability_status === true,
                        reason: v.reason,
                      };
                    }}
                    onDone={refresh}
                  />
                  <ActionButton
                    label="Recompute stats"
                    title="Recompute rating, jobs and earnings?"
                    description="Counts them again from reviews and bookings, for when the numbers look wrong."
                    path={`${base}/recompute-stats`}
                    permission="professionals.edit"
                    reason={false}
                    onDone={refresh}
                  />
                </>
              }
            />

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={14}>
                <Card title="Profile" style={{ height: '100%' }}>
                  <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                    <Descriptions.Item label="Contact">
                      <PersonLink user={p.user} /> · {p.user.phone_number}
                    </Descriptions.Item>
                    <Descriptions.Item label="City">{p.city || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Experience">
                      {[p.experience_level, p.years_of_experience !== null ? `${p.years_of_experience} years` : null].filter(Boolean).join(', ') || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Hourly rate">{ugx(p.hourly_rate)}</Descriptions.Item>
                    <Descriptions.Item label="Plan">{p.subscription ? `${p.subscription.plan} (${p.subscription.status})` : 'free'}</Descriptions.Item>
                    <Descriptions.Item label="Joined">{day(p.created_at)}</Descriptions.Item>
                    <Descriptions.Item label="Bio" span={2}>
                      <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{p.bio || '—'}</Typography.Paragraph>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card title="Record" style={{ height: '100%' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Rating">{Number(p.average_rating).toFixed(2)}</Descriptions.Item>
                    <Descriptions.Item label="Jobs completed">{p.total_jobs_completed}</Descriptions.Item>
                    <Descriptions.Item label="Earned">{ugx(p.total_earnings)}</Descriptions.Item>
                    <Descriptions.Item label="Open disputes">{p.counts.open_disputes ? <Tag color="orange">{p.counts.open_disputes}</Tag> : 0}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            <Card title="Services">
              <Table<Service> dataSource={p.services} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }}>
                <Table.Column<Service> dataIndex="service_name" title="Service" />
                <Table.Column<Service> dataIndex="category" title="Category" render={(c: Service['category']) => c.name} />
                <Table.Column<Service> dataIndex="base_price" title="From" render={ugx} />
                <Table.Column<Service> dataIndex="is_active" title="State" render={(a: boolean) => (a ? <Tag color="green">shown</Tag> : <Tag>hidden</Tag>)} />
                <Table.Column<Service>
                  title=""
                  render={(_, s) => (
                    <ActionButton
                      label={s.is_active ? 'Hide' : 'Show'}
                      title={s.is_active ? `Hide "${s.service_name}"?` : `Show "${s.service_name}" again?`}
                      description={s.is_active ? 'Clients stop seeing this service on the profile and in search.' : undefined}
                      method="PATCH"
                      path={`${base}/services/${s.id}`}
                      permission="professionals.edit"
                      danger={s.is_active}
                      buttonProps={{ size: 'small' }}
                      toBody={(v) => ({ is_active: !s.is_active, reason: v.reason })}
                      onDone={refresh}
                    />
                  )}
                />
              </Table>
            </Card>

            <Card title="Certificates and licences">
              <Table<Document> dataSource={p.documents} rowKey="id" pagination={false} size="small" scroll={{ x: 700 }}>
                <Table.Column<Document>
                  dataIndex="title"
                  title="Document"
                  render={(title: string, d) => (
                    <Space direction="vertical" size={0}>
                      {d.url ? (
                        <a href={d.url} target="_blank" rel="noreferrer noopener">
                          {title}
                        </a>
                      ) : (
                        title
                      )}
                      <Typography.Text type="secondary">{d.document_type.replace(/_/g, ' ')}</Typography.Text>
                    </Space>
                  )}
                />
                <Table.Column<Document> title="State" render={(_, d) => documentState(d)} />
                <Table.Column<Document> dataIndex="rejection_reason" title="Why rejected" render={(r: string | null) => r ?? '—'} />
                <Table.Column<Document> dataIndex="created_at" title="Uploaded" render={when} />
                <Table.Column<Document>
                  title=""
                  render={(_, d) => (
                    <Space>
                      {!d.is_verified && (
                        <ActionButton
                          label="Approve"
                          title={`Approve "${d.title}"?`}
                          description="The professional is told it was approved."
                          path={`${base}/documents/${d.id}/review`}
                          permission="users.verify"
                          reason={false}
                          buttonProps={{ size: 'small' }}
                          toBody={() => ({ decision: 'approve' })}
                          onDone={refresh}
                        />
                      )}
                      {(d.is_verified || !d.rejection_reason) && (
                        <ActionButton
                          label="Reject"
                          title={`Reject "${d.title}"?`}
                          description="The professional sees your reason and can upload it again."
                          path={`${base}/documents/${d.id}/review`}
                          permission="users.verify"
                          danger
                          buttonProps={{ size: 'small' }}
                          toBody={(v) => ({ decision: 'reject', reason: v.reason })}
                          onDone={refresh}
                        />
                      )}
                    </Space>
                  )}
                />
              </Table>
            </Card>

            <Card title="Portfolio">
              {p.portfolio.length === 0 ? (
                <Empty description="Nothing in the portfolio" />
              ) : (
                <Row gutter={[16, 16]}>
                  {p.portfolio.map((item) => (
                    <Col key={item.id} xs={24} sm={12} md={8} xl={6}>
                      <Card
                        size="small"
                        cover={item.image ? <Image src={item.image} height={160} style={{ objectFit: 'cover' }} /> : undefined}
                        actions={[
                          <ActionButton
                            key="remove"
                            label="Remove"
                            title={`Remove "${item.title}"?`}
                            description="It is deleted from the portfolio for good, and the professional is told why."
                            path={`${base}/portfolio/${item.id}/remove`}
                            permission="professionals.edit"
                            danger
                            buttonProps={{ size: 'small', type: 'text' }}
                            onDone={refresh}
                          />,
                        ]}
                      >
                        <Card.Meta title={item.title} description={item.is_featured ? <Tag color="gold">featured</Tag> : day(item.created_at)} />
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
          </Space>
        );
      }}
    </DetailState>
  );
}
