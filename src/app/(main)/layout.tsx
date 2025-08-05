'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import '../../../global.css';
import AuthProvider from '../../components/auth/AuthProvider';
import Sidebar from '../../components/layout/Sidebar';
import { useState, useEffect } from 'react';
import { NotificationProvider } from '../../components/notification/NotificationProvider';
import { Layout } from 'antd';

const { Content, Footer } = Layout;

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <NotificationProvider>
            <Layout style={{ minHeight: '100vh' }} hasSider={!isMobile}>
              {!isMobile && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}
              <Layout className="site-layout" style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 200) }}>
                <Content
                  className="main-content"
                  style={{
                    margin: 0,
                    overflowY: 'auto',
                    background: '#fff',
                    paddingBottom: isMobile ? 50 : 0, // Add padding for mobile bottom nav
                  }}
                >
                  {children}
                </Content>
                {!isMobile && (
                  <Footer style={{ textAlign: 'center' }}>
                    Receipt Tracker System ©2023 Created by Gemini
                  </Footer>
                )}
              </Layout>
              {isMobile && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}
            </Layout>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
