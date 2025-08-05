'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Table, Tag, Spin, Typography, Button, Space } from 'antd';
import { useNotification } from '@/src/components/notification/NotificationProvider';
import type { ColumnsType } from 'antd/es/table';

import { useRouter } from 'next/navigation';

import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import Link from "next/link";

const { Title } = Typography;

interface Receipt {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  writtenBy: { username: string; role: string };
  currentApproverRole?: string | null;
  lastActionByRole?: string | null;
  rejectionReason?: string | null;
  dgmActionBy?: string | null;
  gmActionBy?: string | null;
}

export default function HRDashboardPage() {
  const { data: session, status } = useSession();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const api = useNotification();
  const router = useRouter();
  const [pageSize, setPageSize] = useState(10);

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

  const [users, setUsers] = useState<{ id: string; username: string; role: string }[]>([]);

  const columns: ColumnsType<Receipt> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => <Link href={`/receipts/${record.id}`}>{text}</Link>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'geekblue';
        if (status.includes('REJECTED')) {
          color = 'volcano';
        } else if (status.includes('APPROVED')) {
          color = 'green';
        }
        return <Tag color={color}>{status.replace(/_/g, ' ')}</Tag>;
      },
      filters: [
        { text: 'Pending Manager Approval', value: 'PENDING_MANAGER_APPROVAL' },
        { text: 'Approved by Manager (Pending DGM)', value: 'APPROVED_BY_MANAGER_PENDING_DGM' },
        { text: 'Rejected by Manager', value: 'REJECTED_BY_MANAGER' },
        { text: 'Pending DGM', value: 'PENDING_DGM' },
        { text: 'Rejected by DGM', value: 'REJECTED_BY_DGM' },
        { text: 'Approved by DGM (Pending GM)', value: 'APPROVED_BY_DGM_PENDING_GM' },
        { text: 'Rejected by GM', value: 'REJECTED_BY_GM' },
        { text: 'Approved Final', value: 'APPROVED_FINAL' },
      ],
      onFilter: (value, record) => record.status.indexOf(value as string) === 0,
    },
    {
      title: 'Written By',
      dataIndex: ['writtenBy', 'username'],
      key: 'writtenBy',
      filters: users.filter(user => user.role === 'HR').map((user) => ({ text: user.username, value: user.username })),
      onFilter: (value, record) => record.writtenBy.username.indexOf(value as string) === 0,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'DGM Action By',
      dataIndex: 'dgmActionBy',
      key: 'dgmActionBy',
    },
    {
      title: 'GM Action By',
      dataIndex: 'gmActionBy',
      key: 'gmActionBy',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space size="middle">
          <Link href={`/receipts/${record.id}`} passHref>
            <Button icon={<EyeOutlined />} />
          </Link>
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            disabled={record.status !== 'PENDING_DGM' && record.status !== 'PENDING_MANAGER_APPROVAL'} // Changed from PENDING_MGM
          />
        </Space>
      ),
    },
  ];

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'HR') {
      fetchReceipts();
      fetchUsers();
    } else if (status === 'unauthenticated') {
      api.error({
        message: 'Authorization Error',
        description: 'You are not authorized to view this page.',
      });
    }
  }, [session, status, api]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
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
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/receipts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete receipt');
      }
      api.success({
        message: 'Receipt deleted',
        description: 'The receipt has been successfully deleted.',
      });
      fetchReceipts();
    } catch (error: any) {
      api.error({
        message: 'Error deleting receipt',
        description: error.message,
      });
    }
  };

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/receipts');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch receipts');
      }
      const data = await res.json();
      setReceipts(data);
    } catch (error: any) {
      api.error({
        message: 'Error fetching receipts',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

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
    <div className="hr-dashboard-container" style={{ padding: '24px' }}>
      
      <Title level={2}>HR Dashboard - All Receipts</Title>
      <Table columns={columns} dataSource={receipts} rowKey="id" pagination={{ pageSize }} scroll={{ x: 'max-content' }} />
    </div>
  );
}
