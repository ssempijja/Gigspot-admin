import { DownloadOutlined } from '@ant-design/icons';
import { App, Button } from 'antd';
import { useState } from 'react';

import { download } from '../api';
import { useCan } from './ActionButton';

/**
 * Downloads a list as CSV with the filters on screen (at most 10,000 rows; the
 * download is recorded in the audit log). [path] defaults to /admin/exports/[dataset].
 */
export function ExportButton({ dataset, path, query, permission = 'exports.download' }: { dataset?: string; path?: string; query: () => Record<string, unknown>; permission?: string }) {
  const { message } = App.useApp();
  const can = useCan(permission);
  const [busy, setBusy] = useState(false);
  if (!can) return null;

  async function run() {
    setBusy(true);
    try {
      await download(path ?? `/admin/exports/${dataset}`, query());
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'The export failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button icon={<DownloadOutlined />} loading={busy} onClick={() => void run()}>
      Export CSV
    </Button>
  );
}
