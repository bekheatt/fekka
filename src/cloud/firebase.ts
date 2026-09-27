// Firebase is started only when keys are filled in and something actually needs it
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import * as FA from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from './config';

let app: FirebaseApp | null = null;
let auth: FA.Auth | null = null;
let db: Firestore | null = null;

export function firebase() {
  if (!app) {
    app = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);
    // Keep people signed in between app launches. The React Native build of firebase/auth has
    // getReactNativePersistence; its TypeScript types don't list it, hence the lookup.
    const rnPersistence = (FA as any).getReactNativePersistence;
    try {
      auth = rnPersistence ? FA.initializeAuth(app, { persistence: rnPersistence(AsyncStorage) }) : FA.getAuth(app);
    } catch {
      auth = FA.getAuth(app); // already initialised (fast refresh)
    }
    db = getFirestore(app);
  }
  return { app: app!, auth: auth!, db: db! };
}
