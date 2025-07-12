'use client';

import { useEffect, useState } from 'react';
import {Table, Button, message, Tag, Modal, Input, Form} from 'antd';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const { TextArea } = Input;

interface Receipt {
  id: string;
  title: string;
  amount: number;
  status: string;
  writtenBy: { username: string; role: string };
  createdAt: string;
}

export default function GMDashboard() {
  const { data: session, status } = useSession();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [currentReceiptId, setCurrentReceiptId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
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
      const res = await fetch('/api/receipts?status=APPROVED_BY_MGM_PENDING_GM');
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

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/receipts/${id}/approve`, {
        method: 'PUT',
      });
      if (!res.ok) {
        throw new Error('Failed to approve receipt');
      }
      message.success('Receipt approved successfully!');
      fetchReceipts();
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const showRejectModal = (id: string) => {
    setCurrentReceiptId(id);
    setIsRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!currentReceiptId) return;
    try {
      const res = await fetch(`/api/receipts/${currentReceiptId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });
      if (!res.ok) {
        throw new Error('Failed to reject receipt');
      }
      message.success('Receipt rejected successfully!');
      setIsRejectModalVisible(false);
      setRejectionReason('');
      setCurrentReceiptId(null);
      fetchReceipts();
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const handleCancelReject = () => {
    setIsRejectModalVisible(false);
    setRejectionReason('');
    setCurrentReceiptId(null);
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
      title: 'Written By (HR)',
      dataIndex: ['writtenBy', 'username'],
      key: 'writtenBy',
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
        <>
          <Button type="primary" onClick={() => handleApprove(record.id)} style={{ marginRight: 8 }}>
            Approve
          </Button>
          <Button type="default" danger onClick={() => showRejectModal(record.id)}>
            Reject
          </Button>
        </>
      ),
    },
  ];

  if (status === 'loading') {
    return <div>Loading authentication...</div>;
  }

  return (
    <div>
      <h1>GM Dashboard</h1>
      <Table
        dataSource={receipts}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Reject Receipt"
        open={isRejectModalVisible}
        onOk={handleReject}
        onCancel={handleCancelReject}
        okText="Reject"
        cancelText="Cancel"
      >
        <Form layout="vertical">
          <Form.Item label="Rejection Reason">
            <TextArea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection (optional)"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
