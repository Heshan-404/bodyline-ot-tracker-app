'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Input, Button, Card, Typography, notification } from 'antd';

const { Title } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'; // Default to dashboard
  const [api, contextHolder] = notification.useNotification({
    placement: 'bottomRight',
  });

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
      notification.success({
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      {contextHolder}
      <Card style={{ width: 400, textAlign: 'center' }}>
        <Title level={2}>Login</Title>
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
