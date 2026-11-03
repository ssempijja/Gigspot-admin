import { List } from '@refinedev/antd';
import { Input, Rate, Select, Space, Table, Tag, Typography } from 'antd';
import { Link } from 'react-router';

import { day, PersonLink, StatusTag, type UserCard } from '../../components/format';
import { useAdminTable } from '../../components/useAdminTable';
import { OPEN_REPORT, ResolveReport } from './ResolveReport';

export interface ReportRow {
  id: number;
  reason: string;
  description: string;
  status: string;
  reporter: UserCard;
  review: { id: number; rating: number; comment: string; is_hidden: boolean; reviewee: UserCard };
  admin_notes: string | null;
  resolved_by: UserCard | null;
  resolved_at: string | null;
  created_at: string;
}

const STATUSES = ['pending', 'under_review', 'resolved', 'dismissed'];
const REASONS = ['inappropriate', 'spam', 'fake', 'harassment', 'other'];

export function ReportList() {
  const { tableProps, setFilter, filterValue, tableQuery } = useAdminTable<ReportRow>('review-reports', ['status', 'reason', 'search']);

  return (
    <List title="Review reports">
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Words in the report or review"
          defaultValue={filterValue('search') as string | undefined}
          onSearch={(v) => setFilter('search', v)}
          style={{ width: 260 }}
        />
        <Select allowClear placeholder="Status" style={{ width: 150 }} value={filterValue('status')} onChange={(v) => setFilter('status', v)} options={STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))} />
        <Select allowClear placeholder="Reason" style={{ width: 150 }} value={filterValue('reason')} onChange={(v) => setFilter('reason', v)} options={REASONS.map((s) => ({ value: s, label: s }))} />
      </Space>
      <Table<ReportRow> {...tableProps} rowKey="id" scroll={{ x: 1000 }}>
        <Table.Column<ReportRow>
          dataIndex="review"
          title="Review"
          render={(review: ReportRow['review']) => (
            <Space direction="vertical" size={0}>
              <Space size={4}>
                <Rate disabled value={review.rating} style={{ fontSize: 12 }} />
                {review.is_hidden && <Tag color="red">hidden</Tag>}
              </Space>
              <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, maxWidth: 360 }}>
                <Link to={`/reviews/show/${review.id}`}>{review.comment}</Link>
              </Typography.Paragraph>
              <Typography.Text type="secondary">about {review.reviewee.full_name}</Typography.Text>
            </Space>
          )}
        />
        <Table.Column<ReportRow>
          dataIndex="reason"
          title="Report"
          render={(reason: string, r) => (
            <Space direction="vertical" size={0}>
              <Tag>{reason}</Tag>
              <Typography.Text>{r.description}</Typography.Text>
            </Space>
          )}
        />
        <Table.Column<ReportRow> dataIndex="reporter" title="By" render={(u: UserCard) => <PersonLink user={u} />} />
        <Table.Column<ReportRow> dataIndex="status" title="Status" render={(s: string) => <StatusTag value={s} />} />
        <Table.Column<ReportRow> dataIndex="created_at" key="created_at" title="When" sorter defaultSortOrder="descend" render={day} />
        <Table.Column<ReportRow>
          title=""
          render={(_, r) => (OPEN_REPORT.includes(r.status) ? <ResolveReport id={r.id} reviewHidden={r.review.is_hidden} onDone={() => void tableQuery.refetch()} /> : null)}
        />
      </Table>
    </List>
  );
}
