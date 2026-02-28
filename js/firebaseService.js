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

  async function saveContact({ service, type, email, message, language }) {
    return db.collection('contacts').add({
      service,
      type,
      email,
      message,
      language,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      isRead: false
    });
  }

  return { saveContact };
})();
