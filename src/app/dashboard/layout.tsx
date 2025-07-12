'use client';

import { Layout, Menu, theme, message } from 'antd';
import { UserOutlined, FileTextOutlined, DashboardOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

const { Header, Content, Sider } = Layout;

interface MenuItem {
  key: string;
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const getMenuItems = (role: string | undefined): MenuItem[] => {
    const items: MenuItem[] = [
      {
        key: '1',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        onClick: () => router.push('/dashboard'),
      },
    ];

    if (role === 'HR') {
      items.push(
        {
          key: '2',
          icon: <FileTextOutlined />,
          label: 'Create Receipt',
          onClick: () => router.push('/receipts/create'),
        },
        {
          key: '3',
          icon: <FileTextOutlined />,
          label: 'My Receipts',
          onClick: () => router.push('/dashboard/hr'),
        }
      );
    } else if (role === 'MGM') {
      items.push(
        {
          key: '4',
          icon: <FileTextOutlined />,
          label: 'Pending MGM Approval',
          onClick: () => router.push('/dashboard/mgm'),
        }
      );
    } else if (role === 'GM') {
      items.push(
        {
          key: '5',
          icon: <FileTextOutlined />,
          label: 'Pending GM Approval',
          onClick: () => router.push('/dashboard/gm'),
        }
      );
    } else if (role === 'SECURITY') {
      items.push(
        {
          key: '6',
          icon: <FileTextOutlined />,
          label: 'Security View',
          onClick: () => router.push('/dashboard/security'),
        }
      );
    }

    items.push({
      key: 'logout',
      icon: <UserOutlined />,
      label: 'Logout',
      onClick: async () => {
        await signOut({ callbackUrl: '/login' });
        message.success('Logged out successfully!');
      },
    });

    return items;
  };

  if (status === 'loading') {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div className="demo-logo-vertical" />
        <Menu theme="dark" defaultSelectedKeys={[pathname]} mode="inline" items={getMenuItems(session?.user?.role)} />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '0 16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
