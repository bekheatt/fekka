// Paste the values from Firebase console → Project settings → Your apps → Web app.
// These are not secret passwords: Firebase web keys are meant to live in the app.
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
};

export const firebaseReady = () => !!firebaseConfig.apiKey && !!firebaseConfig.authDomain;
