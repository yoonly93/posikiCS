const FirebaseService = (() => {
  const firebaseConfig = {
    apiKey: "AIzaSyD0tUcfC-2Wow6quQwO9fUrZOPZ1h8NPio",
    authDomain: "nanokit-fba56.firebaseapp.com",
    projectId: "nanokit-fba56",
    storageBucket: "nanokit-fba56.firebasestorage.app",
    messagingSenderId: "117734542640",
    appId: "1:117734542640:web:0a49ed1e503a439eae8cf5",
    measurementId: "G-25VJW4937K"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  console.log('[Firebase] initialized, projectId:', firebaseConfig.projectId);

  async function translateToKo(text, fromLang) {
    if (fromLang === 'ko' || !text) return text || '';
    try {
      const url = 'https://api.mymemory.translated.net/get?q='
        + encodeURIComponent(text)
        + '&langpair=' + fromLang + '|ko';
      const res = await fetch(url);
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (translated && translated !== text) return translated;
      return '(자동 번역 실패 - 원문 확인)';
    } catch (e) {
      return '(자동 번역 실패 - 원문 확인)';
    }
  }

  async function saveContact({ service, type, email, message, language }) {
    console.log('[Firebase] saving contact...', { service, type, email });
    try {
      const messageKo = await translateToKo(message, language);
      const docRef = await db.collection('contacts').add({
        service,
        type,
        email,
        message,
        messageKo,
        language,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isRead: false
      });
      console.log('[Firebase] saved! docId:', docRef.id);
      return docRef;
    } catch (err) {
      console.error('[Firebase] save FAILED:', err);
      throw err;
    }
  }

  return { saveContact };
})();
