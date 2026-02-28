'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/firebaseAuth';

export default function ContactsPage() {
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
          <Link href="/admin">대시보드</Link>
          <Link href="/admin/contacts" className="active">문의 관리</Link>
          <Link href="/admin/legal">약관 관리</Link>
          <Link href="/admin/settings">설정</Link>
        </nav>

        <div className="admin-card admin-stub">
          <h2>문의 관리</h2>
          <p>준비 중입니다. 곧 문의 목록 조회 및 관리 기능이 추가됩니다.</p>
        </div>
      </div>
    </>
  );
}
