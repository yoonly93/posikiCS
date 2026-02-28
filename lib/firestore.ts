import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { translateToKo } from './translate';

interface ContactData {
  service: string;
  type: string;
  email: string;
  message: string;
  language: string;
}

export async function saveContact({ service, type, email, message, language }: ContactData) {
  const messageKo = await translateToKo(message, language);
  const docRef = await addDoc(collection(db, 'contacts'), {
    service,
    type,
    email,
    message,
    messageKo,
    language,
    createdAt: serverTimestamp(),
    isRead: false,
  });
  return docRef;
}
