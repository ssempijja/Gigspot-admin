import { List } from '@refinedev/antd';
import { Input, Rate, Select, Space, Table, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router';

import { ExportButton } from '../../components/ExportButton';
import { day, PersonLink, type UserCard } from '../../components/format';
import { LinkedFilters } from '../../components/LinkedFilters';
import { useAdminTable } from '../../components/useAdminTable';

export interface ReviewRow {
  id: number;
  booking_id: number;
  reviewer: UserCard;
  reviewee: UserCard;
  rating: number;
  comment: string;
  response: string | null;
  is_hidden: boolean;
  hidden_by: UserCard | null;
  pending_reports: number;
  likes: number;
  created_at: string;
}

export function ReviewList() {
  const navigate = useNavigate();
  const { tableProps, setFilter, filterValue, exportQuery, clearLinked } = useAdminTable<ReviewRow>('reviews', ['rating', 'hidden', 'reported', 'reviewee', 'search']);

  return (
    <List title="Reviews" headerButtons={<ExportButton dataset="reviews" query={exportQuery} />}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Words or names"
          defaultValue={filterValue('search') as string | undefined}
          onSearch={(v) => setFilter('search', v)}
          style={{ width: 240 }}
        />
        <Select
          allowClear
          placeholder="Rating"
          style={{ width: 120 }}
          value={filterValue('rating')}
          onChange={(v) => setFilter('rating', v)}
          options={[1, 2, 3, 4, 5].map((r) => ({ value: String(r), label: `${r} star${r > 1 ? 's' : ''}` }))}
        />
        <Select
          allowClear
          placeholder="Visibility"
          style={{ width: 140 }}
          value={filterValue('hidden')}
          onChange={(v) => setFilter('hidden', v)}
          options={[
            { value: 'false', label: 'Visible' },
            { value: 'true', label: 'Hidden' },
          ]}
        />
        <Select
          allowClear
          placeholder="Reports"
          style={{ width: 160 }}
          value={filterValue('reported')}
          onChange={(v) => setFilter('reported', v)}
          options={[
            { value: 'true', label: 'Reported' },
            { value: 'false', label: 'Not reported' },
          ]}
        />
        <LinkedFilters labels={{ reviewee: 'About user' }} filterValue={filterValue} clear={clearLinked} />
      </Space>
      <Table<ReviewRow>
        {...tableProps}
        rowKey="id"
        scroll={{ x: 1000 }}
        onRow={(row) => ({ onClick: () => void navigate(`/reviews/show/${row.id}`), style: { cursor: 'pointer' } })}
      >
        <Table.Column<ReviewRow> dataIndex="rating" key="rating" title="Rating" sorter width={150} render={(r: number) => <Rate disabled value={r} style={{ fontSize: 14 }} />} />
        <Table.Column<ReviewRow>
          dataIndex="comment"
          title="Review"
          render={(comment: string, r) => (
            <Space direction="vertical" size={0}>
              <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, maxWidth: 420 }}>
                {comment}
              </Typography.Paragraph>
              <Space size={4} wrap>
                {r.is_hidden && <Tag color="red">hidden</Tag>}
                {r.pending_reports > 0 && <Tag color="orange">{r.pending_reports} report{r.pending_reports > 1 ? 's' : ''}</Tag>}
              </Space>
            </Space>
          )}
        />
        <Table.Column<ReviewRow> dataIndex="reviewer" title="By" render={(u: UserCard) => <PersonLink user={u} />} />
        <Table.Column<ReviewRow> dataIndex="reviewee" title="About" render={(u: UserCard) => <PersonLink user={u} />} />
        <Table.Column<ReviewRow> dataIndex="created_at" key="created_at" title="When" sorter defaultSortOrder="descend" render={day} />
      </Table>
    </List>
  );
}
