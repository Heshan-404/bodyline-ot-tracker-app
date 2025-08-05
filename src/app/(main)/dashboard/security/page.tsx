'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Table, Tag, Spin, Typography, Button, Space } from 'antd';
import { useNotification } from '@/src/components/notification/NotificationProvider';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeOutlined } from '@ant-design/icons';

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
  managerActionBy?: string | null;
  gmActionBy?: string | null;
}

export default function SecurityDashboardPage() {
  const { data: session, status } = useSession();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const api = useNotification();
  const router = useRouter();
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const calculatePageSize = () => {
      const newPageSize = Math.floor((window.innerHeight - 400) / 50);
      setPageSize(newPageSize > 0 ? newPageSize : 1);
    };

    calculatePageSize();
    window.addEventListener('resize', calculatePageSize);

    return () => window.removeEventListener('resize', calculatePageSize);
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'SECURITY') {
      fetchReceipts();
    } else if (status === 'unauthenticated') {
      api.error({
        message: 'Authorization Error',
        description: 'You are not authorized to view this page.',
      });
    }
  }, [session, status, api]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/receipts?status=APPROVED_FINAL');
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
    },
    {
      title: 'Written By',
      dataIndex: ['writtenBy', 'username'],
      key: 'writtenBy',
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
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Link href={`/receipts/${record.id}`} passHref>
            <Button icon={<EyeOutlined />} />
          </Link>
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

  if (status === 'authenticated' && session?.user?.role !== 'SECURITY') {
    router.push(`/dashboard/${session.user.role.toLowerCase()}`);
    return null;
  }

  return (
    <div style={{ padding: '24px' }}>
      
      <Title level={2}>Security Dashboard - Approved Receipts</Title>
      <Table
        columns={columns}
        dataSource={receipts}
        rowKey="id"
        pagination={{ pageSize }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}
