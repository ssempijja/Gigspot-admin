import { ErrorComponent, RefineThemes, ThemedLayout, ThemedTitle, useNotificationProvider } from '@refinedev/antd';
import { Authenticated, Refine } from '@refinedev/core';
import routerProvider, { CatchAllNavigate, DocumentTitleHandler, NavigateToResource } from '@refinedev/react-router';
import { App as AntdApp, ConfigProvider } from 'antd';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';

import '@refinedev/antd/dist/reset.css';
import './styles.css';

import { Header } from './components/Header';
import { BookingList } from './pages/bookings/BookingList';
import { BookingShow } from './pages/bookings/BookingShow';
import { AppOverviewPage } from './pages/app/AppOverviewPage';
import { CrashList } from './pages/app/CrashList';
import { CrashShow } from './pages/app/CrashShow';
import { DevicesPage } from './pages/app/DevicesPage';
import { PerformancePage } from './pages/app/PerformancePage';
import { SignInPage } from './pages/app/SignInPage';
import { UsagePage } from './pages/app/UsagePage';
import { UserTelemetryPage } from './pages/app/UserTelemetryPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ReportPage } from './pages/report/ReportPage';
import { DisputeList } from './pages/disputes/DisputeList';
import { DisputeShow } from './pages/disputes/DisputeShow';
import { CategoryList } from './pages/categories/CategoryList';
import { LoginPage } from './pages/login/LoginPage';
import { SendPage } from './pages/notifications/SendPage';
import { SentList } from './pages/notifications/SentList';
import { TemplateList } from './pages/notifications/TemplateList';
import { ReconciliationPage } from './pages/payments/ReconciliationPage';
import { TransactionList } from './pages/payments/TransactionList';
import { TransactionShow } from './pages/payments/TransactionShow';
import { WalletShow } from './pages/payments/WalletShow';
import { WithdrawalList } from './pages/payments/WithdrawalList';
import { WithdrawalShow } from './pages/payments/WithdrawalShow';
import { PostingList } from './pages/postings/PostingList';
import { PostingShow } from './pages/postings/PostingShow';
import { ProfessionalList } from './pages/professionals/ProfessionalList';
import { ProfessionalShow } from './pages/professionals/ProfessionalShow';
import { ReportList } from './pages/reviews/ReportList';
import { ReviewList } from './pages/reviews/ReviewList';
import { ReviewShow } from './pages/reviews/ReviewShow';
import { AuditLog } from './pages/staff/AuditLog';
import { StaffList } from './pages/staff/StaffList';
import { PlanList } from './pages/subscriptions/PlanList';
import { SubscriptionList } from './pages/subscriptions/SubscriptionList';
import { SubscriptionShow } from './pages/subscriptions/SubscriptionShow';
import { UserList } from './pages/users/UserList';
import { UserShow } from './pages/users/UserShow';
import { accessControlProvider, authProvider, dataProvider } from './providers';
import { resources } from './resources';

const Title = ({ collapsed }: { collapsed: boolean }) => <ThemedTitle collapsed={collapsed} text="Gigspot Admin" />;

export function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Blue}>
        <AntdApp>
          <Refine
            dataProvider={dataProvider}
            authProvider={authProvider}
            accessControlProvider={accessControlProvider}
            routerProvider={routerProvider}
            notificationProvider={useNotificationProvider}
            resources={resources}
            options={{ syncWithLocation: false, warnWhenUnsavedChanges: false, disableTelemetry: true, title: { text: 'Gigspot Admin' } }}
          >
            <Routes>
              <Route
                element={
                  <Authenticated key="admin" fallback={<CatchAllNavigate to="/login" />}>
                    <ThemedLayout Title={Title} Header={Header}>
                      <Outlet />
                    </ThemedLayout>
                  </Authenticated>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/users">
                  <Route index element={<UserList />} />
                  <Route path="show/:id" element={<UserShow />} />
                </Route>
                <Route path="/bookings">
                  <Route index element={<BookingList />} />
                  <Route path="show/:id" element={<BookingShow />} />
                </Route>
                <Route path="/disputes">
                  <Route index element={<DisputeList />} />
                  <Route path="show/:id" element={<DisputeShow />} />
                </Route>
                <Route path="/professionals">
                  <Route index element={<ProfessionalList />} />
                  <Route path="show/:id" element={<ProfessionalShow />} />
                </Route>
                <Route path="/postings">
                  <Route index element={<PostingList />} />
                  <Route path="show/:id" element={<PostingShow />} />
                </Route>
                <Route path="/categories" element={<CategoryList />} />
                <Route path="/transactions">
                  <Route index element={<TransactionList />} />
                  <Route path="show/:id" element={<TransactionShow />} />
                </Route>
                <Route path="/withdrawals">
                  <Route index element={<WithdrawalList />} />
                  <Route path="show/:id" element={<WithdrawalShow />} />
                </Route>
                <Route path="/wallets/show/:id" element={<WalletShow />} />
                <Route path="/reconciliation" element={<ReconciliationPage />} />
                <Route path="/subscriptions">
                  <Route index element={<SubscriptionList />} />
                  <Route path="show/:id" element={<SubscriptionShow />} />
                </Route>
                <Route path="/plans" element={<PlanList />} />
                <Route path="/reviews">
                  <Route index element={<ReviewList />} />
                  <Route path="show/:id" element={<ReviewShow />} />
                </Route>
                <Route path="/review-reports" element={<ReportList />} />
                <Route path="/notifications/send" element={<SendPage />} />
                <Route path="/notifications/sent" element={<SentList />} />
                <Route path="/notifications/templates" element={<TemplateList />} />
                <Route path="/app">
                  <Route index element={<AppOverviewPage />} />
                  <Route path="crashes" element={<CrashList />} />
                  <Route path="crashes/show/:id" element={<CrashShow />} />
                  <Route path="devices" element={<DevicesPage />} />
                  <Route path="usage" element={<UsagePage />} />
                  <Route path="sign-in" element={<SignInPage />} />
                  <Route path="performance" element={<PerformancePage />} />
                  <Route path="users/:id" element={<UserTelemetryPage />} />
                </Route>
                <Route path="/staff" element={<StaffList />} />
                <Route path="/audit-log" element={<AuditLog />} />
                <Route path="*" element={<ErrorComponent />} />
              </Route>
              <Route
                element={
                  <Authenticated key="login" fallback={<Outlet />}>
                    <NavigateToResource resource="dashboard" />
                  </Authenticated>
                }
              >
                <Route path="/login" element={<LoginPage />} />
              </Route>
            </Routes>
            <DocumentTitleHandler
              handler={({ resource }) => (resource?.meta?.label ? `${resource.meta.label} · Gigspot Admin` : 'Gigspot Admin')}
            />
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}
