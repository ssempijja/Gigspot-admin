import { Card, Descriptions, Rate, Space, Table, Tag, Typography } from 'antd';
import { Link, useParams } from 'react-router';

import { ActionButton } from '../../components/ActionButton';
import { DetailHeader, DetailState, useDetail } from '../../components/Detail';
import { PersonLink, StatusTag, when, type UserCard } from '../../components/format';
import type { ReviewRow } from './ReviewList';
import { OPEN_REPORT, ResolveReport } from './ResolveReport';
import type { ReportRow } from './ReportList';

interface ReviewDetail extends ReviewRow {
  reports: ReportRow[];
}


export function ReviewShow() {
  const { id } = useParams();
  const { data, error, isLoading, refresh } = useDetail<ReviewDetail>(`/admin/reviews/${id}`);

  return (
    <DetailState data={data} error={error} isLoading={isLoading}>
      {(r) => {
        const base = `/admin/reviews/${r.id}`;
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <DetailHeader
              title={`Review #${r.id}`}
              tags={
                <>
                  {r.is_hidden ? <Tag color="red">hidden</Tag> : <Tag color="green">visible</Tag>}
                  {r.pending_reports > 0 && <Tag color="orange">{r.pending_reports} open report{r.pending_reports > 1 ? 's' : ''}</Tag>}
                </>
              }
              actions={
                r.is_hidden ? (
                  <ActionButton
                    label="Unhide"
                    title="Put this review back in public view?"
                    description="It counts towards the professional's rating again."
                    path={`${base}/unhide`}
                    permission="reviews.moderate"
                    onDone={refresh}
                  />
                ) : (
                  <ActionButton
                    label="Hide"
                    title="Hide this review?"
                    description="It leaves public view and the professional's rating. The reviewer is told, with your reason."
                    path={`${base}/hide`}
                    permission="reviews.moderate"
                    danger
                    onDone={refresh}
                  />
                )
              }
            />
            <Card>
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Rating">
                  <Rate disabled value={r.rating} style={{ fontSize: 14 }} />
                </Descriptions.Item>
                <Descriptions.Item label="Booking">
                  <Link to={`/bookings/show/${r.booking_id}`}>#{r.booking_id}</Link>
                </Descriptions.Item>
                <Descriptions.Item label="By">
                  <PersonLink user={r.reviewer} />
                </Descriptions.Item>
                <Descriptions.Item label="About">
                  <PersonLink user={r.reviewee} />
                </Descriptions.Item>
                <Descriptions.Item label="Written">{when(r.created_at)}</Descriptions.Item>
                <Descriptions.Item label="Likes">{r.likes}</Descriptions.Item>
                {r.hidden_by && <Descriptions.Item label="Hidden by">{r.hidden_by.full_name}</Descriptions.Item>}
                <Descriptions.Item label="Review" span={2}>
                  <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{r.comment}</Typography.Paragraph>
                </Descriptions.Item>
                <Descriptions.Item label="Professional's reply" span={2}>
                  {r.response || '—'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
            <Card title="Reports">
              <Table<ReportRow> dataSource={r.reports} rowKey="id" pagination={false} size="small" scroll={{ x: 700 }}>
                <Table.Column<ReportRow> dataIndex="reason" title="Reason" render={(v: string) => <Tag>{v}</Tag>} />
                <Table.Column<ReportRow> dataIndex="description" title="What they said" />
                <Table.Column<ReportRow> dataIndex="reporter" title="By" render={(u: UserCard) => <PersonLink user={u} />} />
                <Table.Column<ReportRow> dataIndex="status" title="Status" render={(s: string) => <StatusTag value={s} />} />
                <Table.Column<ReportRow> dataIndex="admin_notes" title="Staff notes" render={(v: string | null) => v ?? '—'} />
                <Table.Column<ReportRow>
                  title=""
                  render={(_, report) => (OPEN_REPORT.includes(report.status) ? <ResolveReport id={report.id} reviewHidden={r.is_hidden} onDone={refresh} /> : null)}
                />
              </Table>
            </Card>
          </Space>
        );
      }}
    </DetailState>
  );
}
