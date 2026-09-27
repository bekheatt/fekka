// Firebase + sign-in keys. Fill these in from the setup guide (docs/SETUP_FIREBASE.md).
// None of these are secret: Firebase web config and OAuth client IDs are meant to ship inside apps.
// Security comes from the Firestore rules (firestore.rules), not from hiding these values.
// Until they're filled in, Fakka works exactly like before: no sign-in screen, data only on the phone.

export const FIREBASE_CONFIG = {
  apiKey: 'PASTE_API_KEY',
  authDomain: 'PASTE_PROJECT_ID.firebaseapp.com',
  projectId: 'PASTE_PROJECT_ID',
  storageBucket: 'PASTE_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'PASTE_SENDER_ID',
  appId: 'PASTE_APP_ID',
};

// Google sign-in (Google Cloud Console → Credentials)
export const GOOGLE_WEB_CLIENT_ID = 'PASTE_WEB_CLIENT_ID.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = 'PASTE_IOS_CLIENT_ID.apps.googleusercontent.com';

export const isCloudConfigured = () => !FIREBASE_CONFIG.apiKey.startsWith('PASTE_');
export const isGoogleConfigured = () => !GOOGLE_IOS_CLIENT_ID.startsWith('PASTE_');
