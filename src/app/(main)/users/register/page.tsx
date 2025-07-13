'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, notification } from 'antd';
import { useRouter } from 'next/navigation';

const { Title } = Typography;
const { Option } = Select;

export default function RegisterUserPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const router = useRouter();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      api.success({
        message: 'User created',
        description: `User ${values.username} has been successfully created.`,
      });
      form.resetFields();
      // Optionally redirect after successful creation
      // router.push('/dashboard/hr');
    } catch (error: any) {
      api.error({
        message: 'Error creating user',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-user-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      {contextHolder}
      <Card className="register-user-card" style={{ width: 500 }}>
        <Title level={2}>Register New User</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Please input the username!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input the email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Confirm Password"
            name="confirm"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('The two passwords that you entered do not match!')
                  );
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: 'Please select a role!' }]}
          >
            <Select placeholder="Select a role">
              <Option value="HR">HR</Option>
              <Option value="DGM">DGM</Option>
              <Option value="GM">GM</Option>
              <Option value="SECURITY">SECURITY</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Register User
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}