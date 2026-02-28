'use client';

import AuthGuard from '@/components/admin/AuthGuard';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
