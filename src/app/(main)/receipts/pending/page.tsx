
'use client';

import { useEffect, useState } from 'react';
import { Table, Tag, Button, Space } from 'antd';
import { useNotification } from '@/src/components/notification/NotificationProvider';
import type { TableColumnsType } from 'antd';
import Link from 'next/link';
import { EyeOutlined } from '@ant-design/icons';

interface Receipt {
  id: string;
  amount: number;
  date: string;
  status: string;
  description: string;
  rejectionReason: string | null;
}

const columns: TableColumnsType<Receipt> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
  },
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
    render: (date) => new Date(date).toLocaleDateString(),
    sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    filters: [
        { text: 'Pending Manager Approval', value: 'PENDING_MANAGER_APPROVAL' },
        { text: 'Approved by Manager (Pending DGM)', value: 'APPROVED_BY_MANAGER_PENDING_DGM' },
        { text: 'Rejected by Manager', value: 'REJECTED_BY_MANAGER' },
        { text: 'Pending DGM', value: 'PENDING_DGM' },
        { text: 'Approved by DGM (Pending GM)', value: 'APPROVED_BY_DGM_PENDING_GM' },
        { text: 'Rejected by DGM', value: 'REJECTED_BY_DGM' },
        { text: 'Rejected by GM', value: 'REJECTED_BY_GM' },
      ],
    onFilter: (value, record) => record.status.indexOf(value as string) === 0,
    render: (status) => {
      let color = 'geekblue';
      if (status.startsWith('REJECTED')) {
        color = 'volcano';
      } else if (status.startsWith('APPROVED')) {
        color = 'green';
      }
      return (
        <Tag color={color} key={status}>
          {status.toUpperCase()}
        </Tag>
      );
    },
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: 'Rejection Reason',
    dataIndex: 'rejectionReason',
    key: 'rejectionReason',
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

export default function PendingReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const api = useNotification();

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
    const fetchReceipts = async () => {
      try {
        const response = await fetch('/api/receipts/pending');
        if (!response.ok) {
          throw new Error('Failed to fetch receipts');
        }
        const data = await response.json();
        setReceipts(data);
      } catch (error) {
        api.error({
          message: 'Error fetching receipts',
          description: 'Failed to fetch receipts',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, []);

  return (
    <div>
      <h1>Pending Receipts</h1>
      <Table columns={columns} dataSource={receipts} loading={loading} rowKey="id" pagination={{ pageSize }} scroll={{ x: 'max-content' }} />
    </div>
  );
}
