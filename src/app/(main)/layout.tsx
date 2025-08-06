'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import '../../../global.css';
import AuthProvider from '../../components/auth/AuthProvider';
import Sidebar from '../../components/layout/Sidebar';
import { useState, useEffect } from 'react';
import { NotificationProvider } from '../../components/notification/NotificationProvider';
import { Layout, ConfigProvider } from 'antd';
import type { ThemeConfig } from 'antd';

const { Content, Footer } = Layout;

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#ee232b',
    colorTextBase: '#000000',
    colorBgBase: '#ffffff',
  },
  components: {
    Layout: {
      bodyBg: '#ffffff',
      headerBg: '#ffffff',
      footerBg: '#ffffff',
      siderBg: '#000000',
    },
    Menu: {
      darkItemBg: '#000000',
      darkSubMenuItemBg: '#000000',
      darkItemSelectedBg: '#ee232b',
      darkItemSelectedColor: '#ffffff',
      darkItemHoverBg: '#333333',
      darkItemHoverColor: '#ffffff',
      darkItemColor: '#ffffff',
    },
    Button: {
      colorPrimary: '#ee232b',
      colorPrimaryHover: '#cc1d23',
      colorPrimaryActive: '#aa181e',
    },
    Tag: {
      defaultBg: '#f0f2f5',
      colorBorder: '#d9d9d9',
      colorText: '#000000',
    },
    Card: {
      headerBg: '#ffffff',
      extraColor: '#000000',
      actionsBg: '#ffffff',
    },
    Table: {
      headerBg: '#f0f2f5',
      headerColor: '#000000',
      rowHoverBg: '#f0f2f5',
    },
    Descriptions: {
    },
  },
};

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
        <ConfigProvider theme={theme}>
          <AuthProvider>
            <NotificationProvider>
              <Layout style={{ minHeight: '100vh' }} hasSider={!isMobile}>
                {!isMobile && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}
                <Layout className="site-layout" style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 200) }}>
                  <Content
                    className="main-content"
                    style={{
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
        </ConfigProvider>
      </body>
    </html>
  );
}
