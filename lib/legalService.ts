import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ── App 관리 ──

export interface AppData {
  name: string;
  features: string[];
  order?: number;
}

export const ALL_FEATURES = [
  'Firebase',
  'Google 로그인',
  'Apple 로그인',
  '위치 수집',
  '카메라',
  '마이크',
  '알림',
  '인앱결제',
  '제3자 광고 SDK',
] as const;

export async function getApps(): Promise<(AppData & { id: string })[]> {
  const snap = await getDocs(collection(db, 'apps'));
  const apps = snap.docs.map((d) => ({ id: d.id, ...(d.data() as AppData) }));
  return apps.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function addApp(appId: string, name: string, order: number) {
  await setDoc(doc(db, 'apps', appId), { name, features: [], order });
}

export async function updateAppName(appId: string, name: string) {
  await updateDoc(doc(db, 'apps', appId), { name });
}

export async function updateAppOrder(appId: string, order: number) {
  await updateDoc(doc(db, 'apps', appId), { order });
}

export async function changeAppId(oldId: string, newId: string) {
  const snap = await getDoc(doc(db, 'apps', oldId));
  if (!snap.exists()) return;
  const data = snap.data() as AppData;
  await setDoc(doc(db, 'apps', newId), data);
  await deleteDoc(doc(db, 'apps', oldId));
}

export async function deleteApp(appId: string) {
  await deleteDoc(doc(db, 'apps', appId));
}

export async function updateAppFeatures(appId: string, features: string[]) {
  await updateDoc(doc(db, 'apps', appId), { features });
}

// ── Legal 문서 관리 ──

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

function legalDocRef(appId: string, docType: string, lang: string) {
  return doc(db, 'legal', appId, docType, lang);
}

export async function getLegalDoc(
  appId: string,
  docType: string,
  lang: string,
): Promise<LegalDoc | null> {
  const snap = await getDoc(legalDocRef(appId, docType, lang));
  if (!snap.exists()) return null;
  return snap.data() as LegalDoc;
}

export async function saveLegalDraft(
  appId: string,
  docType: string,
  lang: string,
  content: string,
) {
  await setDoc(
    legalDocRef(appId, docType, lang),
    { content, isDraft: true, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function publishLegalDoc(
  appId: string,
  docType: string,
  lang: string,
  content: string,
) {
  await setDoc(legalDocRef(appId, docType, lang), {
    content,
    isDraft: false,
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getPublishedLangs(
  appId: string,
  docType: string,
): Promise<string[]> {
  const snap = await getDocs(collection(db, 'legal', appId, docType));
  return snap.docs
    .filter((d) => {
      const data = d.data() as LegalDoc;
      return !data.isDraft;
    })
    .map((d) => d.id);
}

export async function getAppName(appId: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'apps', appId));
  if (!snap.exists()) return null;
  return (snap.data() as AppData).name;
}
