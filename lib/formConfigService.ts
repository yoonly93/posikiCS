import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface FormConfig {
  apps: string[];
  types: string[];
  languages: string[];
  status: 'active' | 'paused';
}

export interface ResolvedForm {
  uid: string;
  config: FormConfig;
}

export async function resolveForm(formId: string): Promise<ResolvedForm | null> {
  // 1단계: formIndex에서 uid 조회
  const indexSnap = await getDoc(doc(db, 'formIndex', formId));
  if (!indexSnap.exists()) return null;

  const { uid } = indexSnap.data() as { uid: string; status: string };
  if (!uid) return null;

  // 2단계: /users/{uid}/contactForms/{formId} 읽기
  const formSnap = await getDoc(doc(db, 'users', uid, 'contactForms', formId));
  if (!formSnap.exists()) return null;

  const raw = formSnap.data() as Record<string, unknown>;
  // 하위호환: language(string) → languages(string[])
  const languages = Array.isArray(raw.languages)
    ? (raw.languages as string[])
    : typeof raw.language === 'string'
      ? [raw.language as string]
      : [];
  const config = { ...(raw as Omit<FormConfig, 'languages'>), languages } as FormConfig;

  return { uid, config };
}
