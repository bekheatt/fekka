// One shared Firebase connection for the browser test (sign-in + database).
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig, firebaseReady } from './firebaseConfig';

export const firebaseApp = () => {
  if (!firebaseReady()) throw new Error('not-configured');
  return getApps()[0] ?? initializeApp(firebaseConfig);
};
