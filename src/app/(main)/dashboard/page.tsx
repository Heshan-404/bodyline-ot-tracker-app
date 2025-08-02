'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spin } from 'antd';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      switch (session.user.role) {
        case 'HR':
          router.push('/dashboard/hr');
          break;
        case 'MANAGER':
          router.push('/dashboard/manager');
          break;
        case 'GM':
          router.push('/dashboard/gm');
          break;
        case 'SECURITY':
          router.push('/dashboard/security');
          break;
        default:
          router.push('/login'); // Fallback or error page
          break;
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return null; // Will redirect, so no content to render directly
}
