import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface AppInfo {
  id: string;
  name: string;
}

export async function getAppList(uid: string): Promise<AppInfo[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'apps'));
  return snap.docs.map((d) => ({
    id: d.id,
    name: (d.data().name as string) || d.id,
  }));
}
