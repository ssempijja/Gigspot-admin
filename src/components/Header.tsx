import { useGetIdentity } from '@refinedev/core';
import { Layout, Space, Tag, Typography, theme } from 'antd';

import type { Me } from '../providers';

/** Top bar: who is signed in and with which roles. */
export function Header() {
  const { token } = theme.useToken();
  const { data: me } = useGetIdentity<Me>();
  return (
    <Layout.Header
      className="gs-header"
      style={{
        background: token.colorBgElevated,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: 64,
        lineHeight: 'normal',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingInline: 24,
      }}
    >
      {me && (
        <Space size={8} wrap={false} style={{ minWidth: 0 }}>
          <Typography.Text strong ellipsis style={{ maxWidth: 180 }}>
            {me.full_name || me.email}
          </Typography.Text>
          {me.roles.map((role) => (
            <Tag key={role} style={{ marginInlineEnd: 0 }}>
              {role.replace('_', ' ')}
            </Tag>
          ))}
        </Space>
      )}
    </Layout.Header>
  );
}
