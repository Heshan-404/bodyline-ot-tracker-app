'use client';

import { useState, useEffect } from 'react';
import { Card, Descriptions, Image, Spin, Typography, notification, Tag, Button, Modal, Form, Input } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
  managerActionBy?: string | null;
}

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionForm] = Form.useForm();

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
      api.error({
        message: 'Error fetching receipt',
        description: error.message,
      });
      router.push('/dashboard'); // Redirect to dashboard on error
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject', reason?: string) => {
    if (!session?.user?.role) {
      api.error({ message: 'Unauthorized', description: 'User role not found.' });
      return;
    }
    setIsSubmitting(true);

    try {
      const endpoint = session.user.role === 'MANAGER' ? `/api/receipts/${id}/manager-action` : `/api/receipts/${id}/status`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to ${action} receipt`);
      }

      api.success({
        message: 'Success',
        description: `Receipt ${action}d successfully!`,
      });
      fetchReceiptDetails(); // Re-fetch to update status
    } catch (error: any) {
      api.error({
        message: 'Action Failed',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showRejectModal = () => {
    setIsRejectModalVisible(true);
  };

  const handleRejectModalOk = async () => {
    try {
      const values = await rejectionForm.validateFields();
      await handleAction('reject', values.rejectionReason);
      setIsRejectModalVisible(false);
      rejectionForm.resetFields();
    } catch (errorInfo) {
      console.log('Validation Failed:', errorInfo);
    }
  };

  const handleRejectModalCancel = () => {
    setIsRejectModalVisible(false);
    rejectionForm.resetFields();
  };

  const canApproveOrReject = () => {
    if (!session?.user?.role || !receipt) return false;

    const { role } = session.user;
    const { status: receiptStatus } = receipt;

    switch (role) {
      case 'DGM':
        return receiptStatus === 'PENDING_DGM';
      case 'GM':
        return receiptStatus === 'APPROVED_BY_DGM_PENDING_GM';
      case 'SECURITY':
        return receiptStatus === 'APPROVED_BY_GM_PENDING_SECURITY';
      default:
        return false;
    }
  };

  if (loading || status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Spin size="large" />
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
    <div className="receipt-detail-container">
      {contextHolder}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: '16px' }}
      >
        Back
      </Button>
      <Card className="receipt-detail-card">
        <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>Receipt Details</Title>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Title">{receipt.title}</Descriptions.Item>
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
          {receipt.dgmActionBy && (
            <Descriptions.Item label="DGM Action By">{receipt.dgmActionBy}</Descriptions.Item>
          )}
          {receipt.gmActionBy && (
            <Descriptions.Item label="GM Action By">{receipt.gmActionBy}</Descriptions.Item>
          )}
          <Descriptions.Item label="Image">
            <Image
              src={receipt.imageUrl}
              alt={receipt.title}
              style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
            />
          </Descriptions.Item>
        </Descriptions>
        {canApproveOrReject() && (
          <div className="receipt-actions" style={{ marginTop: '24px', textAlign: 'right' }}>
            <Button
              type="primary"
              onClick={() => handleAction('approve')}
              style={{ marginRight: '8px' }}
              loading={isSubmitting}
            >
              Approve
            </Button>
            <Button type="default" danger onClick={showRejectModal} loading={isSubmitting}>
              Reject
            </Button>
          </div>
        )}
      </Card>

      <Modal
        title="Reject Receipt"
        open={isRejectModalVisible}
        onOk={handleRejectModalOk}
        onCancel={handleRejectModalCancel}
        confirmLoading={isSubmitting}
      >
        <Form form={rejectionForm} layout="vertical">
          <Form.Item
            name="rejectionReason"
            label="Reason for Rejection"
            rules={[{ required: true, message: 'Please provide a reason for rejection' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
