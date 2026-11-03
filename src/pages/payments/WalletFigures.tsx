import { Alert, Col, Row, Statistic } from 'antd';

import { ugx } from '../../components/format';

export interface Figures {
  total_earned: string;
  pending_release: string;
  adjustments: string;
  withdrawn: string;
  pending_withdrawals: string;
  available: string;
  net: string;
}

const ITEMS: { key: keyof Figures; label: string }[] = [
  { key: 'available', label: 'Available to withdraw' },
  { key: 'total_earned', label: 'Earned (released)' },
  { key: 'pending_release', label: 'Waiting for release' },
  { key: 'pending_withdrawals', label: 'In withdrawals' },
  { key: 'withdrawn', label: 'Withdrawn' },
  { key: 'adjustments', label: 'Manual adjustments' },
];

/** A professional's balance, with a warning when refunds took back money already paid out. */
export function WalletFigures({ figures }: { figures: Figures }) {
  return (
    <>
      {Number(figures.net) < 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`This balance is ${ugx(figures.net)}: a refund took back money that was already paid out.`}
        />
      )}
      <Row gutter={[16, 16]}>
        {ITEMS.map((item) => (
          <Col key={item.key} xs={12} md={8}>
            <Statistic title={item.label} value={ugx(figures[item.key])} />
          </Col>
        ))}
      </Row>
    </>
  );
}
