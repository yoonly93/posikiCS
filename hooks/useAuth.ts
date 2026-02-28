'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isAdminEmail } from '@/lib/firebaseAuth';

export type AuthStatus = 'loading' | 'unauthenticated' | 'unauthorized' | 'authenticated';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setStatus('unauthenticated');
      } else if (!isAdminEmail(u.email)) {
        setStatus('unauthorized');
      } else {
        setStatus('authenticated');
      }
    });
    return unsubscribe;
  }, []);

  return { user, status };
}
