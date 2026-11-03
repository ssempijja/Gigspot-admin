import { ActionButton } from '../../components/ActionButton';

/** Report statuses that still need someone. */
export const OPEN_REPORT = ['pending', 'under_review'];

/** Resolve or dismiss a review report; the reporter is told either way. */
export function ResolveReport({ id, reviewHidden, onDone }: { id: number; reviewHidden: boolean; onDone: () => void }) {
  return (
    <ActionButton
      label="Settle"
      title="Settle this report"
      description="Resolve: the report was right (you can hide the review too). Dismiss: the review stays. The reporter is told the outcome."
      path={`/admin/review-reports/${id}/resolve`}
      permission="reviews.moderate"
      fields={[
        {
          name: 'action',
          label: 'Outcome',
          type: 'select',
          required: true,
          options: [
            { value: 'resolve', label: 'Resolve: the report was right' },
            { value: 'dismiss', label: 'Dismiss: the review stays' },
          ],
        },
        ...(reviewHidden ? [] : [{ name: 'hide_review', label: 'Also hide the review (only when resolving)', type: 'checkbox' as const }]),
      ]}
      toBody={(v) => ({ ...v, hide_review: v.action === 'resolve' && v.hide_review === true })}
      onDone={onDone}
    />
  );
}
