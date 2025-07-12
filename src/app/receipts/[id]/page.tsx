'use client';

import { useEffect, useState } from 'react';
import { Card, Descriptions, Image, Spin, Typography, message, Tag } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const { Title } = Typography;

interface Receipt {
  id: string;
  title: string;
  amount: number;
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

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReceiptDetails();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, id]);

  const fetchReceiptDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/receipts/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch receipt details');
      }
      const data = await res.json();
      setReceipt(data);
    } catch (error: any) {
      message.error(error.message);
      router.push('/dashboard'); // Redirect to dashboard on error
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Spin size="large" tip="Loading receipt details..." />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3}>Receipt not found or unauthorized access.</Title>
        <Button type="primary" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>Receipt Details</Title>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Title">{receipt.title}</Descriptions.Item>
          <Descriptions.Item label="Amount">${receipt.amount.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color="blue">{receipt.status.replace(/_/g, ' ')}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Written By">{receipt.writtenBy.username} ({receipt.writtenBy.role})</Descriptions.Item>
          <Descriptions.Item label="Created At">{new Date(receipt.createdAt).toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="Last Updated">{new Date(receipt.updatedAt).toLocaleString()}</Descriptions.Item>
          {receipt.description && (
            <Descriptions.Item label="Description">{receipt.description}</Descriptions.Item>
          )}
          {receipt.currentApproverRole && (
            <Descriptions.Item label="Current Approver">
              <Tag color="green">{receipt.currentApproverRole}</Tag>
            </Descriptions.Item>
          )}
          {receipt.lastActionByRole && (
            <Descriptions.Item label="Last Action By">
              <Tag color="purple">{receipt.lastActionByRole}</Tag>
            </Descriptions.Item>
          )}
          {receipt.rejectionReason && (
            <Descriptions.Item label="Rejection Reason">{receipt.rejectionReason}</Descriptions.Item>
          )}
          <Descriptions.Item label="Image">
            <Image
              src={receipt.imageUrl}
              alt={receipt.title}
              style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
            />
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
