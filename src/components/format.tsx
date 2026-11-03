import { Tag } from 'antd';
import dayjs from 'dayjs';
import { Link } from 'react-router';

/** Display helpers shared by the pages. */

/** "50000.00" -> "UGX 50,000" (amounts are whole shillings in practice). */
export function ugx(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  const sign = amount < 0 ? '-' : '';
  const digits = Math.abs(amount).toLocaleString('en-UG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${sign}UGX ${digits}`;
}

export const when = (value: string | null | undefined) => (value ? dayjs(value).format('D MMM YYYY, HH:mm') : '—');
export const day = (value: string | null | undefined) => (value ? dayjs(value).format('D MMM YYYY') : '—');

const COLOURS: Record<string, string> = {
  active: 'green',
  verified: 'green',
  completed: 'green',
  processed: 'green',
  resolved: 'green',
  paid: 'green',
  approved: 'blue',
  confirmed: 'blue',
  in_progress: 'blue',
  under_review: 'gold',
  pending: 'gold',
  processing: 'gold',
  open: 'orange',
  suspended: 'red',
  rejected: 'red',
  cancelled: 'default',
  refunded: 'purple',
  closed: 'default',
  failed: 'red',
};

/** A coloured tag for a status word ("in_progress" shows as "in progress"). */
export function StatusTag({ value }: { value: string | null | undefined }) {
  if (!value) return <>—</>;
  return <Tag color={COLOURS[value] ?? 'default'}>{value.replace(/_/g, ' ')}</Tag>;
}

/** The small user card admin lists use for a person. */
export interface UserCard {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
}

/** A person's name linking to their user page, with their phone underneath when [phone]. */
export function PersonLink({ user, phone }: { user: UserCard | null | undefined; phone?: boolean }) {
  if (!user) return <>—</>;
  return (
    <span>
      <Link to={`/users/show/${user.id}`} onClick={(e) => e.stopPropagation()}>
        {user.full_name || user.email}
      </Link>
      {phone && (
        <>
          <br />
          <small style={{ opacity: 0.65 }}>{user.phone_number}</small>
        </>
      )}
    </span>
  );
}
