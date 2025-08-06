'use client';

import { useEffect, useState, useMemo } from 'react';
import { Table, Tag, Typography, Button, Space, Empty } from 'antd';
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
  createdBy?: { username: string; role: string }; // Add createdBy
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



  const columns: ColumnsType<Receipt> = useMemo(() => [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
      filters: Array.from(new Set(receipts.map(r => r.title))).map(title => ({ text: title, value: title })),
      onFilter: (value, record) => record.title.indexOf(value as string) === 0,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let displayStatus = status.replace(/_/g, ' ');
        let color = '#ee232b'; // Default to primary red

        if (status.includes('_PENDING_')) {
          const parts = status.split('_PENDING_');
          if (parts.length > 1) {
            displayStatus = 'PENDING ' + parts[1].replace(/_/g, ' ');
          }
        } else if (status === 'PENDING') { // Handle generic PENDING status if it exists
          displayStatus = 'PENDING';
        }

        if (status.includes('REJECTED')) {
          color = '#ee232b'; // Red for rejected
        } else if (status.includes('APPROVED')) {
          color = '#52c41a'; // Green for approved
        } else {
          color = '#faad14'; // Orange for pending/other statuses
        }
        return <Tag color={color}>{displayStatus}</Tag>;
      },
    },
    {
      title: 'Written By',
      dataIndex: ['writtenBy', 'username'],
      key: 'writtenBy',
      filters: Array.from(new Set(receipts.map(r => r.writtenBy.username).filter(Boolean))).map(user => ({ text: user, value: user as string })),
      onFilter: (value, record) => record.writtenBy.username.indexOf(value as string) === 0,
      sorter: (a, b) => a.writtenBy.username.localeCompare(b.writtenBy.username),
    },
    {
      title: 'Created By HR',
      dataIndex: ['createdBy', 'username'],
      key: 'createdBy',
      render: (text) => text || 'N/A',
      filters: Array.from(new Set(receipts.map(r => r.createdBy?.username).filter(Boolean))).map(user => ({ text: user, value: user as string })),
      onFilter: (value, record) => record.createdBy?.username.indexOf(value as string) === 0,
      sorter: (a, b) => (a.createdBy?.username || '').localeCompare(b.createdBy?.username || ''),
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
  ], [receipts]);

  if (loading || status === 'loading') {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2} style={{ marginBottom: '24px' }}>GM Dashboard - Pending Receipts</Title>
        <Table
          columns={columns}
          dataSource={[]}
          loading={true}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role !== 'GM') {
    router.push(`/dashboard/${session.user.role.toLowerCase()}`);
    return null;
  }

  return (
    <div className="gm-dashboard-container" style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>GM Dashboard - Pending Receipts</Title>
      <Table
        columns={columns}
        dataSource={receipts}
        rowKey="id"
        pagination={{ pageSize, style: { justifyContent: 'center', display: 'flex' } }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description="No pending receipts for GM." /> }}
      />
    </div>
  );
}
