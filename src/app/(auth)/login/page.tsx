'use client';

import { useState, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Input, Button, Card, Typography } from 'antd';
import { useNotification } from '@/src/components/notification/NotificationProvider';

const { Title } = Typography;

function LoginPageContent() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'; // Default to dashboard
  const api = useNotification();

  const onFinish = async (values: any) => {
    setLoading(true);
    const result = await signIn('credentials', {
      redirect: false,
      username: values.username,
      password: values.password,
    });
    setLoading(false);

    if (result?.error) {
      api.error({
        message: 'Login Failed',
        description: result.error,
      });
    } else {
      console.log('Login successful, signIn result:', result);
      api.success({
        message: 'Login Successful',
        description: 'You have successfully logged in.',
      });
      const session = await getSession();
      console.log('Session after getSession():', session);
      if (session?.user?.role) {
        router.push(`/dashboard/${session.user.role.toLowerCase()}`);
      } else {
        router.push(callbackUrl);
      }
    }
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000000' }}>
      <Card className="login-card" style={{ width: 400, textAlign: 'center' }}>
        <Title level={2} style={{ marginBottom: '24px' }}>Login</Title>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input placeholder="Username" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Log in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
