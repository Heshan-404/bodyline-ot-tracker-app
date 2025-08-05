'use client';

import { useEffect, useState } from 'react';
import {
  DashboardOutlined,
  FileTextOutlined,
  HistoryOutlined,
  LogoutOutlined,
  UserAddOutlined,
  UserOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { Layout, Menu, Button } from 'antd';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const { Sider, Footer } = Layout;

export default function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (collapsed: boolean) => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    session?.user?.role ? {
      key: `/dashboard/${session.user.role.toLowerCase()}`,
      icon: <DashboardOutlined />,
      label: <Link href={`/dashboard/${session.user.role.toLowerCase()}`}>Dashboard</Link>,
    } : null,
    session?.user?.role === 'HR' ? {
      key: '/receipts/create',
      icon: <FileTextOutlined />,
      label: <Link href="/receipts/create">Create Receipt</Link>,
    } : null,
    (session?.user?.role === 'DGM' || session?.user?.role === 'GM' || session?.user?.role === 'MANAGER') ? {
      key: '/history',
      icon: <HistoryOutlined />,
      label: <Link href="/history">History</Link>,
    } : null,
    session?.user?.role === 'SECURITY' ? {
      key: '/receipts/pending',
      icon: <HistoryOutlined />,
      label: <Link href="/receipts/pending">Pending Receipts</Link>,
    } : null,
    session?.user?.role === 'HR' ? {
      key: '/users/register',
      icon: <UserAddOutlined />,
      label: <Link href="/users/register">Register User</Link>,
    } : null,
    session?.user?.role === 'HR' ? {
      key: '/users/manage',
      icon: <UserOutlined />,
      label: <Link href="/users/manage">Manage Users</Link>,
    } : null,
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: <Link href="/profile">Profile</Link>,
    },
    {
      key: '/logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () =>
        signOut({
          callbackUrl: window.location.origin + '/login',
        }),
    },
  ].filter(Boolean);

  if (isMobile) {
    return (
      <Footer style={{ position: 'fixed', bottom: 0, width: '100%', zIndex: 1, padding: 0 }}>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={[pathname]}
          items={menuItems}
          style={{ display: 'flex', justifyContent: 'space-around' }}
        />
      </Footer>
    );
  }

  return (
    <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} style={{ height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}>
      <div className="demo-logo-vertical" />
      <Menu
        theme="dark"
        defaultSelectedKeys={[pathname]}
        mode="inline"
        style={{ height: '100%', borderRight: 0, overflowY: 'auto' }}
        items={menuItems}
      />
    </Sider>
  );
}