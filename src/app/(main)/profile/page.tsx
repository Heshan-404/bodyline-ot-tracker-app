'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, notification, Card, Typography } from 'antd';
import { useSession } from 'next-auth/react';

const { Title } = Typography;

export default function ProfileSettingsPage() {
  const { data: session, status, update } = useSession();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.name) {
      form.setFieldsValue({
        username: session.user.name,
      });
    }
  }, [status, session, form]);

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3}>Access Denied</Title>
        <p>Please log in to view your profile settings.</p>
      </div>
    );
  }

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      api.success({
        message: 'Profile Updated',
        description: 'Profile updated successfully!',
      });
      // Update session data if username changed
      if (values.username && values.username !== session?.user?.name) {
        await update({ name: values.username });
      }
      form.resetFields(['password', 'confirm']); // Clear password fields after update
    } catch (error: any) {
      api.error({
        message: 'Profile Update Failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}
      <Card style={{ maxWidth: 600, margin: '0 auto' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>Profile Settings</Title>
        <Form
          form={form}
          name="profile"
          onFinish={onFinish}
          layout="vertical"
          scrollToFirstError
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="password"
            label="New Password"
            rules={[
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve(); // Password is optional
                  }
                  if (value.length < 6) {
                    return Promise.reject(new Error('Password must be at least 6 characters long'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
            hasFeedback
          >
            <Input.Password placeholder="Leave blank to keep current password" />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="Confirm New Password"
            dependencies={['password']}
            hasFeedback
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords that you entered do not match!'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Update Profile
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
