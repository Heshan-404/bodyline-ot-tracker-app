'use client';

import { useEffect, useState } from 'react';
import { Table, Tag, Spin, Typography, Button, Space } from 'antd';
import { useNotification } from '@/src/components/notification/NotificationProvider';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  gmActionBy?: string | null;
}

export default function GMDashboardPage() {
  const { data: session, status } = useSession();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [pageSize, setPageSize] = useState(10);
  const api = useNotification();

  useEffect(() => {
    const calculatePageSize = () => {
      const newPageSize = Math.floor((window.innerHeight - 400) / 50);
      setPageSize(newPageSize > 0 ? newPageSize : 1);
    };

    calculatePageSize();
    window.addEventListener('resize', calculatePageSize);

    return () => window.removeEventListener('resize', calculatePageSize);
  }, []);

  const [users, setUsers] = useState<{ id: string; username: string; role: string }[]>([]);



  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'GM') {
      fetchReceipts();
    } else if (status === 'unauthenticated') {
      api.error({
        message: 'Authorization Error',
        description: 'You are not authorized to view this page.',
      });
    }
  }, [session, status]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/receipts?status=APPROVED_BY_DGM_PENDING_GM');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch receipts');
      }
      const data = await res.json();
      console.log('Fetched receipts for GM Dashboard:', data);
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

  if (status === 'authenticated' && session?.user?.role !== 'GM') {
    router.push(`/dashboard/${session.user.role.toLowerCase()}`);
    return null;
  }

  const columns: ColumnsType<Receipt> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'geekblue';
        if (status === 'PENDING') {
          color = 'volcano';
        } else if (status === 'APPROVED') {
          color = 'green';
        } else if (status === 'REJECTED') {
          color = 'red';
        }
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Written By',
      dataIndex: ['writtenBy', 'username'],
      key: 'writtenBy',
    },
    {
      title: 'DGM Action By',
      dataIndex: 'dgmActionBy',
      key: 'dgmActionBy',
      filters: Array.from(new Set(receipts.map(r => r.dgmActionBy).filter(Boolean))).map(user => ({ text: user, value: user as string })),
      onFilter: (value, record) => record.dgmActionBy?.indexOf(value as string) === 0,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Link href={`/receipts/${record.id}`} passHref>
            <Button icon={<EyeOutlined />} />
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div className="gm-dashboard-container" style={{ padding: '24px' }}>
      <Title level={2}>GM Dashboard - Pending Receipts</Title>
      <Table columns={columns} dataSource={receipts} rowKey="id" pagination={{ pageSize }} scroll={{ x: 'max-content' }} />
    </div>
  );
}
