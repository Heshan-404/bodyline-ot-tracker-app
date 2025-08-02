'use client';

import {useEffect, useState, useCallback} from 'react';
import {useSession} from 'next-auth/react';
import {Table, Tag, notification, Spin, Typography, Button, Space} from 'antd';
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
}

export default function ReceiptsHistoryPage() {
    const {data: session, status} = useSession();
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(true);
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
            notification.error({
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

            notification.success({
                message: 'Receipt Deleted',
                description: 'The receipt has been successfully deleted.',
            });
            fetchReceipts(); // Refresh the list
        } catch (error: any) {
            notification.error({
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
            filters: Array.from(new Set(receipts.map(r => r.writtenBy.username).filter(Boolean))).map(user => ({
                text: user,
                value: user as string
            })),
            onFilter: (value, record) => record.writtenBy.username.indexOf(value as string) === 0,
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
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh'}}>
                <Spin size="large"/>
            </div>
        );
    }

    

    return (
        <div className="receipts-history-container">
            <Title level={2}>Receipts History</Title>
            <Table columns={session?.user.role === 'HR' ? hrColumns : columns} dataSource={receipts} rowKey="id"
                   pagination={{pageSize}} scroll={{x: 'max-content'}}/>
        </div>
    );
}
