import { useQueryClient } from '@tanstack/react-query';
import { Alert, Card, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import { ActionButton } from '../../components/ActionButton';
import { day, ugx } from '../../components/format';
import { PLANS_KEY, usePlans, type Plan } from './usePlans';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Plan names, display prices and availability. Google Play charges its own price. */
export function PlanList() {
  const client = useQueryClient();
  const { data = [], isLoading, error } = usePlans();
  const refresh = () => void client.invalidateQueries({ queryKey: PLANS_KEY });

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Plans
      </Typography.Title>
      <Alert type="info" showIcon message="Prices here are what the app shows. Google Play charges the price set in the Play Console; change both together." />
      {error && <Alert type="error" showIcon message={(error as Error).message} />}
      <Card>
        <Table<Plan> dataSource={data} rowKey="code" loading={isLoading} pagination={false} scroll={{ x: 900 }}>
          <Table.Column<Plan>
            dataIndex="name"
            title="Plan"
            render={(name: string, p) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{name}</Typography.Text>
                <Typography.Text type="secondary" code>
                  {p.code}
                </Typography.Text>
              </Space>
            )}
          />
          <Table.Column<Plan> dataIndex="audience" title="For" />
          <Table.Column<Plan> dataIndex="period" title="Period" />
          <Table.Column<Plan> dataIndex="price_ugx" title="Shown price" render={ugx} />
          <Table.Column<Plan>
            dataIndex="is_active"
            title="On sale"
            render={(active: boolean, p) => (
              <Space size={4} wrap>
                {active ? <Tag color="green">on sale</Tag> : <Tag>off sale</Tag>}
                {p.available_until && <Tag color="gold">through {day(p.available_until)}</Tag>}
              </Space>
            )}
          />
          <Table.Column<Plan> dataIndex="active_subscribers" title="Subscribers with access" />
          <Table.Column<Plan> dataIndex="sort_order" title="Order" />
          <Table.Column<Plan>
            title=""
            render={(_, p) => (
              <ActionButton
                label="Edit"
                title={`Edit ${p.name}`}
                method="PATCH"
                path={`/admin/subscriptions/plans/${p.code}`}
                permission="subscriptions.manage"
                fields={[
                  { name: 'name', label: 'Name', type: 'text', required: true, initial: p.name },
                  { name: 'price_ugx', label: 'Shown price in UGX (empty: none)', type: 'text', initial: p.price_ugx ? String(Number(p.price_ugx)) : '', pattern: /^\d+$/, patternMessage: 'Use digits only.' },
                  { name: 'available_until', label: 'Last day of the offer (YYYY-MM-DD, empty: no end)', type: 'text', initial: p.available_until ? dayjs(p.available_until).format('YYYY-MM-DD') : '' },
                  { name: 'sort_order', label: 'Order in the app', type: 'text', required: true, initial: String(p.sort_order), pattern: /^\d+$/, patternMessage: 'Use digits only.' },
                  { name: 'is_active', label: 'On sale', type: 'checkbox', initial: p.is_active },
                ]}
                toBody={(v) => {
                  const until = String(v.available_until ?? '').trim();
                  if (until && !DATE.test(until)) throw new Error('Write the offer end as YYYY-MM-DD.');
                  return {
                    name: v.name,
                    price_ugx: String(v.price_ugx ?? '').trim() || null,
                    // On sale through the end of that day, in this browser's time zone.
                    available_until: until ? dayjs(until).endOf('day').toISOString() : null,
                    sort_order: Number(v.sort_order ?? 0),
                    is_active: v.is_active === true,
                    reason: v.reason,
                  };
                }}
                onDone={refresh}
              />
            )}
          />
        </Table>
      </Card>
    </Space>
  );
}
