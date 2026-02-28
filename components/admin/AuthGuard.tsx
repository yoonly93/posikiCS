'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/firebaseAuth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const redirected = useRef(false);

  useEffect(() => {
    if (status === 'unauthenticated' && !redirected.current) {
      redirected.current = true;
      window.location.replace('/admin/login');
    }
  }, [status]);

  useEffect(() => {
    if (status === 'unauthorized') {
      const timer = setTimeout(async () => {
        await signOut();
        window.location.replace('/admin/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="admin-login-wrapper">
        <p>Loading...</p>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="admin-error">접근 권한이 없습니다</div>
          <p>2초 후 로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
