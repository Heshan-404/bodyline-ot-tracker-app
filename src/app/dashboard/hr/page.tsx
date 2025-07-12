'use client';

import { useEffect, useState } from 'react';
import { Table, Button, message, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Key } from 'react';

interface Receipt {
  id: string;
  title: string;
  amount: number;
  status: string;
  currentApproverRole: string | null;
  createdAt: string;
}

export default function HRDashboard() {
  const { data: session, status } = useSession();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReceipts();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/receipts');
      if (!res.ok) {
        throw new Error('Failed to fetch receipts');
      }
      const data = await res.json();
      setReceipts(data);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a: Receipt, b: Receipt) => a.amount - b.amount,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color="blue">{status.replace(/_/g, ' ')}</Tag>,
      filters: [
        { text: 'Pending MGM', value: 'PENDING_MGM' },
        { text: 'Approved by MGM Pending GM', value: 'APPROVED_BY_MGM_PENDING_GM' },
        { text: 'Approved by GM Pending Security', value: 'APPROVED_BY_GM_PENDING_SECURITY' },
        { text: 'Approved Final', value: 'APPROVED_FINAL' },
        { text: 'Rejected by MGM', value: 'REJECTED_BY_MGM' },
        { text: 'Rejected by GM', value: 'REJECTED_BY_GM' },
      ],
      onFilter: (value: Key, record: Receipt) => record.status.indexOf(value as string) === 0,
    },
    {
      title: 'Current Approver',
      dataIndex: 'currentApproverRole',
      key: 'currentApproverRole',
      render: (role: string | null) => role ? <Tag color="green">{role}</Tag> : 'N/A',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: Receipt, b: Receipt) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Receipt) => (
        <Button onClick={() => router.push(`/receipts/${record.id}`)}>
          View Details
        </Button>
      ),
    },
  ];

  if (status === 'loading') {
    return <div>Loading authentication...</div>;
  }

  return (
    <div>
      <h1>HR Dashboard</h1>
      <Button
        type="primary"
        onClick={() => router.push('/receipts/create')}
        style={{ marginBottom: 16 }}
      >
        Create New Receipt
      </Button>
      <Table
        dataSource={receipts}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
