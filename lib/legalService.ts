import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ── 상수 ──

export const DOC_TYPES = [
  { value: 'privacy', label: '개인정보처리방침' },
  { value: 'terms', label: '이용약관' },
] as const;

export const DOC_LANGS = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
] as const;

export interface LegalDoc {
  content: string;
  isDraft: boolean;
  publishedAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// ── 읽기 전용 함수 ──

export async function getLegalDoc(
  uid: string,
  appId: string,
  docType: string,
  lang: string,
): Promise<LegalDoc | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'legal', appId, docType, lang));
  if (!snap.exists()) return null;
  return snap.data() as LegalDoc;
}

export async function getPublishedLangs(
  uid: string,
  appId: string,
  docType: string,
): Promise<string[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'legal', appId, docType));
  return snap.docs
    .filter((d) => {
      const data = d.data() as LegalDoc;
      return !data.isDraft;
    })
    .map((d) => d.id);
}

export async function getAppName(uid: string, appId: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'apps', appId));
  if (!snap.exists()) return null;
  return (snap.data().name as string) || null;
}
