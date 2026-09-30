// Browser version: each Google account gets one private record in Firestore,
// at users/<their id>. Security rules in Firebase make sure only that person can read or write it.
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '../auth/firebase.web';

export const cloudAvailable = true;
const db = () => getFirestore(firebaseApp());

// The whole app data is stored as one piece of text, so the database never
// rejects a field shape and loading it back gives exactly what was saved.
export async function loadUserData(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db(), 'users', uid));
  return snap.exists() ? (snap.data().data as string) ?? null : null;
}

export async function saveUserData(uid: string, json: string): Promise<void> {
  await setDoc(doc(db(), 'users', uid), { data: json, updatedAt: serverTimestamp() });
}
