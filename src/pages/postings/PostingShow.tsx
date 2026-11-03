import { Card, Descriptions, Image, Space, Table, Tag, Typography } from 'antd';
import { Link, useParams } from 'react-router';

import { ActionButton } from '../../components/ActionButton';
import { DetailHeader, DetailState, useDetail } from '../../components/Detail';
import { day, PersonLink, StatusTag, ugx, when, type UserCard } from '../../components/format';
import { AuditHistoryLink } from '../../components/PermittedLink';
import { budget, type PostingRow } from './PostingList';

interface Quote {
  id: number;
  professional: UserCard & { profile_id: number };
  quote_amount: string;
  materials_cost: string;
  status: string;
  created_at: string;
}

interface PostingDetail extends PostingRow {
  description: string;
  requirements: string;
  urgency: string;
  job_type: string | null;
  experience_level: string | null;
  address: string;
  district: string;
  preferred_date: string | null;
  images: unknown;
  quotes: Quote[];
}

/** Matches the API: only these can be closed by staff. */
const OPEN = ['pending', 'quoted'];

/** Image links stored with the posting (absolute URLs only; anything else is skipped). */
const imageUrls = (images: unknown) =>
  (Array.isArray(images) ? images : []).filter((u): u is string => typeof u === 'string' && /^https?:\/\//.test(u));

export function PostingShow() {
  const { id } = useParams();
  const { data, error, isLoading, refresh } = useDetail<PostingDetail>(`/admin/postings/${id}`);

  return (
    <DetailState data={data} error={error} isLoading={isLoading}>
      {(p) => {
        const base = `/admin/postings/${p.id}`;
        const job = p.posting_type === 'job';
        const images = imageUrls(p.images);
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <DetailHeader
              title={`#${p.id} ${p.title}`}
              tags={
                <>
                  <Tag color={job ? 'purple' : 'default'}>{job ? 'company job' : 'gig'}</Tag>
                  <StatusTag value={p.status} />
                  {p.urgency !== 'medium' && <Tag color={p.urgency === 'urgent' || p.urgency === 'high' ? 'red' : 'default'}>{p.urgency}</Tag>}
                </>
              }
              actions={
                <>
                  <AuditHistoryLink type="JobRequest" id={p.id} />
                  <ActionButton
                    label="Edit wording"
                    title="Edit the title or description"
                    description="For removing phone numbers, abuse or misleading text. The client is told, with your reason."
                    method="PATCH"
                    path={base}
                    permission="postings.edit"
                    fields={[
                      { name: 'title', label: 'Title', type: 'text', required: true, initial: p.title },
                      { name: 'description', label: 'Description', type: 'textarea', required: true, initial: p.description },
                    ]}
                    toBody={(v) => ({
                      ...(v.title !== p.title ? { title: v.title } : {}),
                      ...(v.description !== p.description ? { description: v.description } : {}),
                      reason: v.reason,
                    })}
                    onDone={refresh}
                  />
                  {OPEN.includes(p.status) && (
                    <ActionButton
                      label="Close"
                      title="Take this posting down?"
                      description={
                        job
                          ? 'It leaves the listings. The company is told why.'
                          : `It leaves the listings, ${p.quotes.filter((q) => q.status === 'pending').length} pending quote(s) are declined, and everyone involved is told.`
                      }
                      path={`${base}/close`}
                      permission="postings.edit"
                      danger
                      onDone={refresh}
                    />
                  )}
                </>
              }
            />

            <Card title="Posting">
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Posted by">
                  <PersonLink user={p.client} /> · {p.client.phone_number}
                </Descriptions.Item>
                <Descriptions.Item label="Category">{p.category?.name ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Where">{[p.address, p.district, p.city].filter(Boolean).join(', ') || '—'}</Descriptions.Item>
                <Descriptions.Item label="Budget">{budget(p)}</Descriptions.Item>
                {job ? (
                  <>
                    <Descriptions.Item label="Job type">{p.job_type?.replace('_', ' ') ?? '—'}</Descriptions.Item>
                    <Descriptions.Item label="Experience">{p.experience_level ?? '—'}</Descriptions.Item>
                    <Descriptions.Item label="Applications">{p.applications_count}</Descriptions.Item>
                  </>
                ) : (
                  <Descriptions.Item label="Wanted on">{day(p.preferred_date)}</Descriptions.Item>
                )}
                <Descriptions.Item label="Posted">{when(p.created_at)}</Descriptions.Item>
                <Descriptions.Item label="Closes">{when(p.expires_at)}</Descriptions.Item>
                {p.booking_id && (
                  <Descriptions.Item label="Booking">
                    <Link to={`/bookings/show/${p.booking_id}`}>#{p.booking_id}</Link>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Description" span={2}>
                  <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{p.description}</Typography.Paragraph>
                </Descriptions.Item>
                {p.requirements && (
                  <Descriptions.Item label="Requirements" span={2}>
                    <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{p.requirements}</Typography.Paragraph>
                  </Descriptions.Item>
                )}
              </Descriptions>
              {images.length > 0 && (
                <Image.PreviewGroup>
                  <Space wrap style={{ marginTop: 16 }}>
                    {images.map((src) => (
                      <Image key={src} src={src} width={120} height={90} style={{ objectFit: 'cover' }} />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              )}
            </Card>

            {!job && (
              <Card title={`Quotes (${p.quotes.length})`}>
                <Table<Quote> dataSource={p.quotes} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }}>
                  <Table.Column<Quote>
                    dataIndex="professional"
                    title="Professional"
                    render={(pro: Quote['professional']) => <Link to={`/professionals/show/${pro.profile_id}`}>{pro.full_name}</Link>}
                  />
                  <Table.Column<Quote> dataIndex="quote_amount" title="Quote" render={ugx} />
                  <Table.Column<Quote> dataIndex="materials_cost" title="Of which materials" render={(m: string) => (Number(m) ? ugx(m) : '—')} />
                  <Table.Column<Quote> dataIndex="status" title="Status" render={(s: string) => <StatusTag value={s} />} />
                  <Table.Column<Quote> dataIndex="created_at" title="Sent" render={when} />
                </Table>
              </Card>
            )}
          </Space>
        );
      }}
    </DetailState>
  );
}
