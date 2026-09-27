// Firebase + sign-in keys for the fakka-6882e Firebase project.
// None of these are secret: Firebase web config and OAuth client IDs are meant to ship inside apps.
// Security comes from the Firestore rules (firestore.rules), not from hiding these values.
// If apiKey starts with PASTE_, cloud features switch off and the app keeps data on the phone only.

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAsWSmasnpL5Gg1GrBpIEKByCkjxGElzto',
  authDomain: 'fakka-6882e.firebaseapp.com',
  projectId: 'fakka-6882e',
  storageBucket: 'fakka-6882e.firebasestorage.app',
  messagingSenderId: '203574113579',
  appId: '1:203574113579:web:3a00eb1fafe2e4f504c16e',
};

// Google sign-in (Google Cloud Console → Credentials)
export const GOOGLE_WEB_CLIENT_ID = '203574113579-kbkmigc06k197t664jt8mt4dq6p4vvva.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '203574113579-5jlh51p8b4mqgtd9ahusudgtud7d76ge.apps.googleusercontent.com';

export const isCloudConfigured = () => !FIREBASE_CONFIG.apiKey.startsWith('PASTE_');
export const isGoogleConfigured = () => !GOOGLE_IOS_CLIENT_ID.startsWith('PASTE_');
