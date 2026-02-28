import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function getClaudeApiKey(): Promise<string> {
  const snap = await getDoc(doc(db, 'settings', 'claude'));
  if (snap.exists()) {
    return (snap.data().apiKey as string) || '';
  }
  return '';
}

export async function setClaudeApiKey(apiKey: string) {
  await setDoc(doc(db, 'settings', 'claude'), { apiKey });
}
