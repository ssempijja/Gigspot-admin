import { Button } from 'antd';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { useCan } from './ActionButton';

/** A link styled as a button, shown only to staff with [permission]. */
export function PermittedLink({ to, permission, children }: { to: string; permission: string; children: ReactNode }) {
  if (!useCan(permission)) return null;
  return (
    <Link to={to}>
      <Button type="link" style={{ paddingInline: 4 }}>
        {children}
      </Button>
    </Link>
  );
}

/** "History": this record's entries in the audit log. */
export function AuditHistoryLink({ type, id }: { type: string; id: number | string }) {
  return (
    <PermittedLink to={`/audit-log?entity_type=${type}&entity_id=${id}`} permission="audit.view">
      History
    </PermittedLink>
  );
}
