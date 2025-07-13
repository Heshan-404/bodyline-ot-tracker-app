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
    if (status === 'authenticated' && session?.user) {
      form.setFieldsValue({
        username: session.user.name,
        email: session.user.email,
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
      if (values.email && values.email !== session?.user?.email) {
        await update({ email: values.email });
      }
      form.resetFields(['password', 'confirm', 'currentPassword']); // Clear password fields after update
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
    <div className="profile-container">
      {contextHolder}
      <Card className="profile-card" style={{ margin: '0 auto' }}>
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
          >
            <Input readOnly />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input placeholder="Leave blank to keep current email" />
          </Form.Item>

          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('password') || getFieldValue('email') !== session?.user?.email) {
                    if (!value) {
                      return Promise.reject(new Error('Please input your current password to make changes!'));
                    }
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password placeholder="Required to change password or email" />
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
