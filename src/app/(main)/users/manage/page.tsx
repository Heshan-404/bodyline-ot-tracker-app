'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Table, notification, Spin, Typography, Button, Modal, Select, Form, Input, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '@/src/components/ConfirmationModal';

const { Title } = Typography;
const { Option } = Select;

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function ManageUsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, contextHolder] = notification.useNotification();
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm] = Form.useForm();
  const [pageSize, setPageSize] = useState(10);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; username: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const useWindowSize = () => {
    const [size, setSize] = useState([0, 0]);
    useEffect(() => {
      function updateSize() {
        setSize([window.innerWidth, window.innerHeight]);
      }
      window.addEventListener('resize', updateSize);
      updateSize();
      return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
  };

  const [width, height] = useWindowSize();

  useEffect(() => {
    if (height) {
      const newPageSize = Math.floor((height - 400) / 50);
      setPageSize(newPageSize > 0 ? newPageSize : 1);
    }
  }, [height]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'HR') {
      fetchUsers(roleFilter);
    } else if (status === 'unauthenticated') {
      api.error({
        message: 'Authorization Error',
        description: 'You are not authorized to view this page.',
      });
    }
  }, [session, status, api, roleFilter]);

  const fetchUsers = async (filter?: string) => {
    try {
      setLoading(true);
      const query = filter ? `?role=${filter}` : '';
      const res = await fetch(`/api/users${query}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      const data = await res.json();
      setUsers(data);
    } catch (error: any) {
      api.error({
        message: 'Error fetching users',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (userId: string, username: string) => {
    setUserToDelete({ id: userId, username });
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      api.success({
        message: 'User deleted',
        description: `User ${userToDelete.username} has been successfully deleted.`,
      });
      fetchUsers(roleFilter); // Refresh user list with current filter
    } catch (error: any) {
      api.error({
        message: 'Error deleting user',
        description: error.message,
      });
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalVisible(false);
      setUserToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalVisible(false);
    setUserToDelete(null);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    editForm.setFieldsValue({ email: user.email });
    setIsEditModalVisible(true);
  };

  const handleUpdateEmail = async (values: { email: string }) => {
    if (!editingUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update email');
      }

      api.success({
        message: 'Email updated',
        description: `Email for ${editingUser.username} has been updated.`,
      });
      setIsEditModalVisible(false);
      setEditingUser(null);
      fetchUsers(roleFilter); // Refresh user list with current filter
    } catch (error: any) {
      api.error({
        message: 'Error updating email',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalVisible(false);
    setEditingUser(null);
    editForm.resetFields();
  };

  const userColumns: ColumnsType<User> = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'HR', value: 'HR' },
        { text: 'DGM', value: 'DGM' },
        { text: 'GM', value: 'GM' },
        { text: 'SECURITY', value: 'SECURITY' },
      ],
      onFilter: (value, record) => record.role.indexOf(value as string) === 0,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
            disabled={record.role === 'HR'} // Prevent HR from editing themselves or other HRs
          />
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUser(record.id, record.username)}
            danger
            disabled={record.id === session?.user?.id} // Prevent user from deleting themselves
          />
        </Space>
      ),
    },
  ];

  if (loading || status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role !== 'HR') {
    router.push(`/dashboard/${session.user.role.toLowerCase()}`);
    return null;
  }

  return (
    <div className="manage-users-container" style={{ padding: '24px' }}>
      {contextHolder}
      <Title level={2}>User Management</Title>
      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by Role"
          style={{ width: 200 }}
          onChange={(value) => setRoleFilter(value === 'all' ? undefined : value)}
          value={roleFilter || 'all'}
        >
          <Option value="all">All Roles</Option>
          <Option value="HR">HR</Option>
          <Option value="DGM">DGM</Option>
          <Option value="GM">GM</Option>
          <Option value="SECURITY">SECURITY</Option>
        </Select>
      </div>
      <Table columns={userColumns} dataSource={users} rowKey="id" pagination={{ pageSize }} scroll={{ x: 'max-content' }} />

      <Modal
        title="Edit User Email"
        open={isEditModalVisible}
        onCancel={handleCancelEdit}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateEmail}
          initialValues={editingUser || {}}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input the new email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Email
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {userToDelete && (
        <ConfirmationModal
          visible={isDeleteModalVisible}
          title={`Delete User ${userToDelete.username}`}
          content={`Are you sure you want to delete user ${userToDelete.username}? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          confirmLoading={deleteLoading}
        />
      )}
    </div>
  );
}

