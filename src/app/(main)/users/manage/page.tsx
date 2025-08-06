'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Table, Spin, Typography, Button, Modal, Select, Form, Input, Space } from 'antd';
import { useNotification } from '@/src/components/notification/NotificationProvider';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '@/src/components/ConfirmationModal';

const { Title } = Typography;
const { Option } = Select;

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  sectionId?: string;
  section?: { name: string };
}

export default function ManageUsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const api = useNotification();
  const router = useRouter();
  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm] = Form.useForm();
  const [pageSize, setPageSize] = useState(10);
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);

  const [isManageSectionsTableVisible, setIsManageSectionsTableVisible] = useState(false);
  const [isCreateEditSectionFormVisible, setIsCreateEditSectionFormVisible] = useState(false);
  const [sectionForm] = Form.useForm();
  const [editingSection, setEditingSection] = useState<{ id: string; name: string } | null>(null);

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
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/sections');
        if (!res.ok) {
          throw new Error('Failed to fetch sections');
        }
        const data = await res.json();
        setSections(data);
      } catch (error: any) {
        api.error({
          message: 'Error fetching sections',
          description: error.message,
        });
      }
    };
    fetchSections();
  }, []);

  useEffect(() => {
    if (height) {
      const newPageSize = Math.floor((height - 400) / 50);
      setPageSize(newPageSize > 0 ? newPageSize : 1);
    }
  }, [height]);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated' || session?.user?.role !== 'HR') {
      router.push('/dashboard'); // Redirect to dashboard or login if not HR
      return;
    }

    fetchUsers();
  }, [session, status, api, router]);

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
      fetchUsers(); // Refresh user list with current filter
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
    editForm.setFieldsValue({ email: user.email, sectionId: user.sectionId });
    setIsEditModalVisible(true);
  };

  const handleUpdateUser = async (values: { email: string; sectionId?: string }) => {
    if (!editingUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, sectionId: values.sectionId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      api.success({
        message: 'User updated',
        description: `User ${editingUser.username} has been updated.`,
      });
      setIsEditModalVisible(false);
      setEditingUser(null);
      fetchUsers(); // Refresh user list with current filter
    } catch (error: any) {
      api.error({
        message: 'Error updating user',
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

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/sections');
      if (!res.ok) {
        throw new Error('Failed to fetch sections');
      }
      const data = await res.json();
      setSections(data);
    } catch (error: any) {
      api.error({
        message: 'Error fetching sections',
        description: error.message,
      });
    }
  };

  const showManageSectionsTableModal = () => {
    setIsManageSectionsTableVisible(true);
    fetchSections(); // Refresh sections when opening the table
  };

  const showCreateEditSectionFormModal = (section?: { id: string; name: string }) => {
    setEditingSection(section || null);
    sectionForm.resetFields();
    if (section) {
      sectionForm.setFieldsValue(section);
    }
    setIsCreateEditSectionFormVisible(true);
  };

  const handleCancelManageSectionsTableModal = () => {
    setIsManageSectionsTableVisible(false);
  };

  const handleCancelCreateEditSectionFormModal = () => {
    setIsCreateEditSectionFormVisible(false);
    setEditingSection(null);
    sectionForm.resetFields();
  };

  const handleCreateOrUpdateSection = async (values: { name: string }) => {
    try {
      let res;
      if (editingSection) {
        res = await fetch('/api/sections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSection.id, name: values.name }),
        });
      } else {
        res = await fetch('/api/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: values.name }),
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save section');
      }

      api.success({
        message: 'Section saved',
        description: `Section ${values.name} has been successfully saved.`,
      });
      fetchSections();
      handleCancelCreateEditSectionFormModal();
    } catch (error: any) {
      api.error({
        message: 'Error saving section',
        description: error.message,
      });
    }
  };

  const handleDeleteSection = async (id: string) => {
    try {
      const res = await fetch('/api/sections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete section');
      }

      api.success({
        message: 'Section deleted',
        description: 'Section has been successfully deleted.',
      });
      fetchSections();
    } catch (error: any) {
      api.error({
        message: 'Error deleting section',
        description: error.message,
      });
    }
  };

  const handleEditSection = (section: { id: string; name: string }) => {
    showCreateEditSectionFormModal(section);
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
        { text: 'MANAGER', value: 'MANAGER' },
        { text: 'DGM', value: 'DGM' },
        { text: 'GM', value: 'GM' },
        { text: 'SECURITY', value: 'SECURITY' },
        { text: 'REQUESTER', value: 'REQUESTER' },
      ],
      onFilter: (value, record) => record.role.indexOf(value as string) === 0,
    },
    {
      title: 'Section',
      dataIndex: ['section', 'name'],
      key: 'section',
      render: (text, record) => record.role === 'MANAGER' ? text : '',
      filters: sections.map(section => ({ text: section.name, value: section.id })),
      onFilter: (value, record) => record.sectionId === value,
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
    <div className="manage-users-container">
      <Title level={2} style={{ marginBottom: '24px' }}>User Management</Title>
      {session?.user?.role === 'HR' && (
        <Button type="primary" onClick={showManageSectionsTableModal} style={{ marginBottom: 16 }}>
          Manage Sections
        </Button>
      )}
      
      <Table columns={userColumns} dataSource={users} rowKey="id" pagination={{ pageSize }} scroll={{ x: 'max-content' }} />



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

      <Modal
        title={editingUser ? `Edit User: ${editingUser.username}` : ''}
        open={isEditModalVisible}
        onCancel={handleCancelEdit}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateUser}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input the user\'s email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input />
          </Form.Item>
          {editingUser?.role === 'MANAGER' && (
            <Form.Item
              label="Section"
              name="sectionId"
            >
              <Select placeholder="Select a section" allowClear>
                {sections.map((section) => (
                  <Option key={section.id} value={section.id}>
                    {section.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update User
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingSection ? 'Edit Section' : 'Create New Section'}
        open={isCreateEditSectionFormVisible}
        onCancel={handleCancelCreateEditSectionFormModal}
        footer={null}
      >
        <Form
          form={sectionForm}
          layout="vertical"
          onFinish={handleCreateOrUpdateSection}
        >
          <Form.Item
            label="Section Name"
            name="name"
            rules={[{ required: true, message: 'Please input the section name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingSection ? 'Update Section' : 'Create Section'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Manage Sections"
        open={isManageSectionsTableVisible}
        onCancel={handleCancelManageSectionsTableModal}
        footer={[
          <Button key="back" onClick={handleCancelManageSectionsTableModal}>
            Close
          </Button>,
          <Button key="add" type="primary" onClick={() => showCreateEditSectionFormModal()}>
            Add Section
          </Button>,
        ]}
      >
        <Table
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            {
              title: 'Action',
              key: 'action',
              render: (_, record) => (
                <Space>
                  <Button icon={<EditOutlined />} onClick={() => handleEditSection(record)} />
                  <Button icon={<DeleteOutlined />} danger onClick={() => handleDeleteSection(record.id)} />
                </Space>
              ),
            },
          ]}
          dataSource={sections}
          rowKey="id"
          pagination={false}
        />
      </Modal>
    </div>
  );
}

