import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

export async function signOut() {
  return fbSignOut(auth);
}

export function isAdminEmail(email: string | null): boolean {
  if (!email) return false;
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  return email === adminEmail;
}
