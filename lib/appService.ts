import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface AppInfo {
  id: string;
  name: string;
  order: number;
}

export async function getAppList(): Promise<AppInfo[]> {
  const snap = await getDocs(collection(db, 'apps'));
  const apps = snap.docs.map((d) => ({
    id: d.id,
    name: (d.data().name as string) || d.id,
    order: (d.data().order as number) ?? 0,
  }));
  return apps.sort((a, b) => a.order - b.order);
}
