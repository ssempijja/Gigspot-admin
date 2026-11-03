import {
  AuditOutlined,
  CalendarOutlined,
  CrownOutlined,
  DashboardOutlined,
  MessageOutlined,
  SafetyOutlined,
  ShopOutlined,
  StarOutlined,
  TeamOutlined,
  WalletOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ResourceProps } from '@refinedev/core';

/**
 * The side menu. Each screen's name is also its API path under /admin unless
 * the page says otherwise; the permission each needs is in providers.ts.
 * Entries without `list` are menu groups.
 */
export const resources: ResourceProps[] = [
  { name: 'dashboard', list: '/', meta: { label: 'Dashboard', icon: <DashboardOutlined /> } },
  { name: 'users', list: '/users', show: '/users/show/:id', meta: { label: 'Users', icon: <TeamOutlined /> } },
  { name: 'bookings', list: '/bookings', show: '/bookings/show/:id', meta: { label: 'Bookings', icon: <CalendarOutlined /> } },
  { name: 'disputes', list: '/disputes', show: '/disputes/show/:id', meta: { label: 'Disputes', icon: <WarningOutlined /> } },

  { name: 'marketplace', meta: { label: 'Marketplace', icon: <ShopOutlined /> } },
  { name: 'professionals', list: '/professionals', show: '/professionals/show/:id', meta: { label: 'Professionals', parent: 'marketplace' } },
  { name: 'postings', list: '/postings', show: '/postings/show/:id', meta: { label: 'Gigs and jobs', parent: 'marketplace' } },
  { name: 'categories', list: '/categories', meta: { label: 'Categories', parent: 'marketplace' } },

  { name: 'money', meta: { label: 'Money', icon: <WalletOutlined /> } },
  { name: 'transactions', list: '/transactions', show: '/transactions/show/:id', meta: { label: 'Transactions', parent: 'money' } },
  { name: 'withdrawals', list: '/withdrawals', show: '/withdrawals/show/:id', meta: { label: 'Withdrawals', parent: 'money' } },
  { name: 'reconciliation', list: '/reconciliation', meta: { label: 'Reconciliation', parent: 'money' } },
  // Reached from user and withdrawal pages, not the menu.
  { name: 'wallets', show: '/wallets/show/:id', meta: { label: 'Wallet', hide: true } },

  { name: 'plans_group', meta: { label: 'Subscriptions', icon: <CrownOutlined /> } },
  { name: 'subscriptions', list: '/subscriptions', show: '/subscriptions/show/:id', meta: { label: 'Subscribers', parent: 'plans_group' } },
  { name: 'plans', list: '/plans', meta: { label: 'Plans', parent: 'plans_group' } },

  { name: 'content', meta: { label: 'Reviews', icon: <StarOutlined /> } },
  { name: 'reviews', list: '/reviews', show: '/reviews/show/:id', meta: { label: 'All reviews', parent: 'content' } },
  { name: 'review-reports', list: '/review-reports', meta: { label: 'Reports', parent: 'content' } },

  { name: 'messaging', meta: { label: 'Notifications', icon: <MessageOutlined /> } },
  { name: 'send-notification', list: '/notifications/send', meta: { label: 'Send', parent: 'messaging' } },
  { name: 'sent-notifications', list: '/notifications/sent', meta: { label: 'Sent', parent: 'messaging' } },
  { name: 'templates', list: '/notifications/templates', meta: { label: 'Templates', parent: 'messaging' } },

  { name: 'admin', meta: { label: 'Staff', icon: <SafetyOutlined /> } },
  { name: 'staff', list: '/staff', meta: { label: 'Staff and roles', parent: 'admin' } },
  { name: 'audit-log', list: '/audit-log', meta: { label: 'Audit log', parent: 'admin', icon: <AuditOutlined /> } },
];
