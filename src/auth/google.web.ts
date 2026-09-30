// Browser-only test of Google sign-in through Firebase.
// Expo loads this file instead of google.ts when running on the web,
// so the phone app never includes any of this code.
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { firebaseReady } from './firebaseConfig';
import { firebaseApp } from './firebase.web';

export type GoogleUser = { uid: string; name: string; email: string };

export const googleAvailable = true;

const auth = () => getAuth(firebaseApp());

export async function signInWithGoogle(): Promise<GoogleUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const { user } = await signInWithPopup(auth(), provider);
  return { uid: user.uid, name: user.displayName ?? '', email: user.email ?? '' };
}

export async function signOutGoogle() {
  if (firebaseReady()) await signOut(auth()).catch(() => {});
}
