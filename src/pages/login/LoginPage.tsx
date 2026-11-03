import { LockOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons';
import { useLogin } from '@refinedev/core';
import { Alert, Button, Card, Form, Input, Layout, Space, Steps, Typography } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

import { api, ApiError } from '../../api';
import { session } from '../../session';

/**
 * Admin sign-in, in the steps the API requires:
 *   1. the staff member's normal Gigspot account (phone or email + password)
 *   2. first time only: the one-time enrolment code a super admin gave them,
 *      then scanning the authenticator secret
 *   3. the 6-digit code from the authenticator app
 */

type Step = 'account' | 'enrol' | 'scan' | 'code';

interface Status {
  is_staff: boolean;
  totp_enrolled: boolean;
}

interface Setup {
  secret: string;
  otpauth_url: string;
}

interface Session {
  token: string;
  expires_at: string;
}

export function LoginPage() {
  const { mutate: finishLogin } = useLogin();
  const [step, setStep] = useState<Step>('account');
  const [setup, setSetup] = useState<Setup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const signIn = (values: { username: string; password: string }) =>
    run(async () => {
      const { data } = await api<{ tokens: { access: string } }>('/auth/login', { method: 'POST', body: values, auth: 'none' });
      session.setApp(data.tokens.access);
      const status = (await api<Status>('/admin/auth/status', { auth: 'app' })).data;
      if (!status.is_staff) {
        session.clear();
        throw new ApiError('This account does not have admin access.', 403, 'not_staff');
      }
      setStep(status.totp_enrolled ? 'code' : 'enrol');
    });

  const enrol = (values: { enrolment_code: string }) =>
    run(async () => {
      setSetup((await api<Setup>('/admin/auth/totp/setup', { method: 'POST', body: values, auth: 'app' })).data);
      setStep('scan');
    });

  const verify = (values: { code: string }) =>
    run(async () => {
      const path = setup ? '/admin/auth/totp/confirm' : '/admin/auth/session';
      const { data } = await api<Session>(path, { method: 'POST', body: { code: values.code.trim() }, auth: 'app' });
      session.setAdmin(data.token, data.expires_at);
      finishLogin({});
    });

  const current = { account: 0, enrol: 1, scan: 1, code: 2 }[step];

  return (
    <Layout style={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Card style={{ width: '100%', maxWidth: 440 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Typography.Title level={3} style={{ marginBottom: 4 }}>
              Gigspot Admin
            </Typography.Title>
            <Typography.Text type="secondary">Staff only. Every action here is recorded.</Typography.Text>
          </div>
          <Steps size="small" current={current} items={[{ title: 'Account' }, { title: 'Authenticator' }, { title: 'Code' }]} />
          {error && <Alert type="error" showIcon message={error} />}

          {step === 'account' && (
            <Form layout="vertical" onFinish={signIn} requiredMark={false}>
              <Form.Item name="username" label="Phone number or email" rules={[{ required: true, message: 'Enter your phone number or email.' }]}>
                <Input prefix={<UserOutlined />} autoComplete="username" autoFocus />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Enter your password.' }]}>
                <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={busy}>
                Continue
              </Button>
            </Form>
          )}

          {step === 'enrol' && (
            <Form layout="vertical" onFinish={enrol} requiredMark={false}>
              <Typography.Paragraph>
                Set up an authenticator app (such as Google Authenticator) first. Enter the enrolment code a super admin gave you.
              </Typography.Paragraph>
              <Form.Item name="enrolment_code" label="Enrolment code" rules={[{ required: true, message: 'Enter your enrolment code.' }]}>
                <Input placeholder="ABCD-EFGH-JKMN" autoComplete="off" autoFocus />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={busy}>
                Continue
              </Button>
            </Form>
          )}

          {step === 'scan' && setup && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Typography.Paragraph>Scan this code with your authenticator app, then enter the 6-digit code it shows.</Typography.Paragraph>
              <div style={{ display: 'flex', justifyContent: 'center', padding: 8, background: '#fff' }}>
                <QRCodeSVG value={setup.otpauth_url} size={184} />
              </div>
              <Typography.Text type="secondary">
                Can&apos;t scan? Enter this key instead: <Typography.Text code copyable>{setup.secret}</Typography.Text>
              </Typography.Text>
              <Button type="primary" block onClick={() => setStep('code')}>
                I&apos;ve added it
              </Button>
            </Space>
          )}

          {step === 'code' && (
            <Form layout="vertical" onFinish={verify} requiredMark={false}>
              <Form.Item
                name="code"
                label="6-digit code from your authenticator app"
                rules={[{ required: true, pattern: /^\s*\d{6}\s*$/, message: 'Enter the 6 digits.' }]}
              >
                <Input prefix={<SafetyOutlined />} inputMode="numeric" autoComplete="one-time-code" maxLength={8} autoFocus />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={busy}>
                Sign in
              </Button>
            </Form>
          )}
        </Space>
      </Card>
    </Layout>
  );
}
