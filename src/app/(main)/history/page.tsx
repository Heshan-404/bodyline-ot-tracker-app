'use client';

import {useEffect, useState, useCallback} from 'react';
import {useSession} from 'next-auth/react';
import {Table, Tag, Typography, Button, Space, Empty} from 'antd';
import { useNotification } from '@/src/components/notification/NotificationProvider';
import type {ColumnsType} from 'antd/es/table';
import Link from 'next/link';
import {EyeOutlined} from '@ant-design/icons';
import {useRouter} from 'next/navigation';

const {Title} = Typography;

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
    createdBy?: { username: string; role: string }; // Add createdBy
}

export default function ReceiptsHistoryPage() {
    const {data: session, status} = useSession();
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

    const fetchReceipts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/receipts?view=history`);
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
    }, []);

    const handleDelete = async (receiptId: string) => {
        try {
            const res = await fetch(`/api/receipts/${receiptId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete receipt');
            }

            api.success({
                message: 'Receipt Deleted',
                description: 'The receipt has been successfully deleted.',
            });
            fetchReceipts(); // Refresh the list
        } catch (error: any) {
            api.error({
                message: 'Error Deleting Receipt',
                description: error.message,
            });
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchReceipts();
        } else if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, fetchReceipts, router]);

    const columns: ColumnsType<Receipt> = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => <Link href={`/history/${record.id}`}>{text}</Link>,
            sorter: (a, b) => a.title.localeCompare(b.title),
            filters: Array.from(new Set(receipts.map(r => r.title))).map(title => ({ text: title, value: title })),
            onFilter: (value, record) => record.title.indexOf(value as string) === 0,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: [
                {text: 'Pending Manager Approval', value: 'PENDING_MANAGER_APPROVAL'},
                {text: 'Approved by Manager (Pending DGM)', value: 'APPROVED_BY_MANAGER_PENDING_DGM'},
                {text: 'Rejected by Manager', value: 'REJECTED_BY_MANAGER'},
                {text: 'Pending DGM', value: 'PENDING_DGM'},
                {text: 'Approved by DGM (Pending GM)', value: 'APPROVED_BY_DGM_PENDING_GM'},
                {text: 'Approved Final', value: 'APPROVED_FINAL'},
                {text: 'Rejected by DGM', value: 'REJECTED_BY_DGM'},
                {text: 'Rejected by GM', value: 'REJECTED_BY_GM'},
            ],
            onFilter: (value, record) => record.status.indexOf(value as string) === 0,
            render: (status: string) => {
                let displayStatus = status.replace(/_/g, ' ');
                let color = '#ee232b'; // Default to primary red

                if (status.includes('_PENDING_')) {
                    const parts = status.split('_PENDING_');
                    if (parts.length > 1) {
                        displayStatus = 'PENDING ' + parts[1].replace(/_/g, ' ');
                    }
                } else if (status === 'PENDING_MANAGER_APPROVAL') {
                    displayStatus = 'PENDING MANAGER APPROVAL';
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
            filters: Array.from(new Set(receipts.map(r => r.writtenBy.username).filter(Boolean))).map(user => ({
                text: user,
                value: user as string
            })),
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
            filters: Array.from(new Set(receipts.map(r => r.dgmActionBy).filter(Boolean))).map(user => ({
                text: user,
                value: user as string
            })),
            onFilter: (value, record) => record.dgmActionBy?.indexOf(value as string) === 0,
            sorter: (a, b) => (a.dgmActionBy || '').localeCompare(b.dgmActionBy || ''),
        },
        {
            title: 'GM Action By',
            dataIndex: 'gmActionBy',
            key: 'gmActionBy',
            filters: Array.from(new Set(receipts.map(r => r.gmActionBy).filter(Boolean))).map(user => ({
                text: user,
                value: user as string
            })),
            onFilter: (value, record) => record.gmActionBy?.indexOf(value as string) === 0,
            sorter: (a, b) => (a.gmActionBy || '').localeCompare(b.gmActionBy || ''),
        },
        {
            title: 'Manager Action By',
            dataIndex: 'managerActionBy',
            key: 'managerActionBy',
            filters: Array.from(new Set(receipts.map(r => r.managerActionBy).filter(Boolean))).map(user => ({
                text: user,
                value: user as string
            })),
            onFilter: (value, record) => record.managerActionBy?.indexOf(value as string) === 0,
            sorter: (a, b) => (a.managerActionBy || '').localeCompare(b.managerActionBy || ''),
        },
        {
            title: 'Rejection Reason',
            dataIndex: 'rejectionReason',
            key: 'rejectionReason',
            filters: Array.from(new Set(receipts.map(r => r.rejectionReason).filter(Boolean))).map(reason => ({
                text: reason,
                value: reason as string
            })),
            onFilter: (value, record) => record.rejectionReason?.indexOf(value as string) === 0,
            render: (text) => text || 'N/A',
            sorter: (a, b) => (a.rejectionReason || '').localeCompare(b.rejectionReason || ''),
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleString(),
            sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Link href={`/receipts/${record.id}`} passHref>
                    <Button icon={<EyeOutlined />} />
                </Link>
            ),
        },
    ];

    const hrColumns: ColumnsType<Receipt> = [
        ...columns,
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Link href={`/receipts/${record.id}`} passHref>
                        <Button icon={<EyeOutlined/>}/>
                    </Link>
                    {session?.user?.role === 'HR' && (
                        <Button danger onClick={() => handleDelete(record.id)}>
                            Delete
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    if (loading || status === 'loading') {
        return (
            <div style={{ padding: '24px' }}>
                <Title level={2} style={{ marginBottom: '24px' }}>Receipts History</Title>
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

    

    return (
        <div className="receipts-history-container">
            <Title level={2} style={{ marginBottom: '24px' }}>Receipts History</Title>
            <Table columns={session?.user.role === 'HR' ? hrColumns : columns} dataSource={receipts} rowKey="id"
                   pagination={{pageSize, style: { justifyContent: 'center', display: 'flex' }}} scroll={{x: 'max-content'}}
                   locale={{ emptyText: <Empty description="No history found." /> }}
            />
        </div>
    );
}
