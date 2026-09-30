// Paste the values from Firebase console → Project settings → Your apps → Web app.
// These are not secret passwords: Firebase web keys are meant to live in the app.
export const firebaseConfig = {
  apiKey: 'AIzaSyAsWSmasnpL5Gg1GrBpIEKByCkjxGElzto',
  authDomain: 'fakka-6882e.firebaseapp.com',
  projectId: 'fakka-6882e',
  storageBucket: 'fakka-6882e.firebasestorage.app',
  messagingSenderId: '203574113579',
  appId: '1:203574113579:web:3a00eb1fafe2e4f504c16e',
};

export const firebaseReady = () => !!firebaseConfig.apiKey && !!firebaseConfig.authDomain;
