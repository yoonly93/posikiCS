'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/firebaseAuth';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <>
      <header className="admin-header">
        <h2>nanokit</h2>
        <div className="admin-header-actions">
          <span>{user?.email}</span>
          <button className="admin-signout-btn" onClick={() => signOut()}>
            로그아웃
          </button>
        </div>
      </header>

      <div className="admin-content">
        <nav className="admin-nav">
          <Link href="/admin" className="active">대시보드</Link>
          <Link href="/admin/contacts">문의 관리</Link>
          <Link href="/admin/legal">약관 관리</Link>
          <Link href="/admin/settings">설정</Link>
        </nav>

        <div className="admin-stat-grid">
          <div className="admin-stat-card">
            <div className="label">총 문의</div>
            <div className="value">-</div>
          </div>
          <div className="admin-stat-card">
            <div className="label">미읽음</div>
            <div className="value">-</div>
          </div>
          <div className="admin-stat-card">
            <div className="label">오늘</div>
            <div className="value">-</div>
          </div>
        </div>

        <div className="admin-card">
          <h3 style={{ marginBottom: 8 }}>환영합니다!</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
            nanokit 관리자 대시보드입니다. 메뉴에서 문의 관리 및 약관 관리 기능을 사용할 수 있습니다.
          </p>
        </div>
      </div>
    </>
  );
}
