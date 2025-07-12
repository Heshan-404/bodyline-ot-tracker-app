'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../../../global.css";
import AuthProvider from '../../components/auth/AuthProvider';
import { Layout, Menu, notification } from 'antd';
import {
  UserOutlined,
  DashboardOutlined,
  FileTextOutlined,
  UserAddOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const { Header, Content, Footer, Sider } = Layout;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [api, contextHolder] = notification.useNotification();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {contextHolder}
          <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible>
              <div className="demo-logo-vertical" />
              <Menu theme="dark" defaultSelectedKeys={[pathname]} mode="inline">
                <Menu.Item key="/dashboard" icon={<DashboardOutlined />}>
                  <Link href="/dashboard">Dashboard</Link>
                </Menu.Item>
                <Menu.Item key="/receipts" icon={<FileTextOutlined />}>
                  <Link href="/receipts">Receipts</Link>
                </Menu.Item>
                <Menu.Item key="/users/register" icon={<UserAddOutlined />}>
                  <Link href="/users/register">Register User</Link>
                </Menu.Item>
                <Menu.Item key="/profile" icon={<UserOutlined />}>
                  <Link href="/profile">Profile Settings</Link>
                </Menu.Item>
                <Menu.Item key="/logout" icon={<LogoutOutlined />} onClick={() => signOut({
                  callbackUrl: '/login'
                })}>
                  Logout
                </Menu.Item>
              </Menu>
            </Sider>
            <Layout>
              <Header style={{ padding: 0, background: '#fff' }} />
              <Content style={{ margin: '0 16px' }}>
                {children}
              </Content>
              <Footer style={{ textAlign: 'center' }}>
                Receipt Tracker System ©2023 Created by Gemini
              </Footer>
            </Layout>
          </Layout>
        </AuthProvider>
      </body>
    </html>
  );
}