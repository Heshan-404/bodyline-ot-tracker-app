'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Table, Tag, notification, Spin, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';

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
}

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
  },
];

export default function HRDashboardPage() {
  const { data: session, status } = useSession();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'HR') {
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

  if (session?.user?.role !== 'HR') {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3}>Access Denied</Title>
        <p>You do not have permission to view this dashboard.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}
      <Title level={2}>HR Dashboard - All Receipts</Title>
      <Table columns={columns} dataSource={receipts} rowKey="id" />
    </div>
  );
}