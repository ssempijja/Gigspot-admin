import { Tag } from 'antd';

/**
 * Filters that arrive only through links (a user's payments, a booking's
 * transactions) have no control of their own: show each as a tag that clears it.
 */
export function LinkedFilters({ labels, filterValue, clear }: { labels: Record<string, string>; filterValue: (field: string) => unknown; clear: (field: string) => void }) {
  return (
    <>
      {Object.entries(labels)
        .filter(([field]) => filterValue(field) !== undefined)
        .map(([field, label]) => (
          <Tag key={field} closable color="blue" onClose={() => clear(field)} style={{ paddingBlock: 4 }}>
            {label} #{String(filterValue(field))}
          </Tag>
        ))}
    </>
  );
}
