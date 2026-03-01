import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface FormConfig {
  apps: string[];
  types: string[];
  languages: string[];
  status: 'active' | 'paused';
}

export async function getFormConfig(formId: string): Promise<FormConfig | null> {
  const snap = await getDoc(doc(db, 'contactForms', formId));
  if (!snap.exists()) return null;
  const raw = snap.data() as Record<string, unknown>;
  // 하위호환: language(string) → languages(string[])
  const languages = Array.isArray(raw.languages)
    ? (raw.languages as string[])
    : typeof raw.language === 'string'
      ? [raw.language as string]
      : [];
  return { ...(raw as Omit<FormConfig, 'languages'>), languages } as FormConfig;
}
