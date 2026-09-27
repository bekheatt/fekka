// Sign in with Apple / Google → Firebase account. Also sign-out and account deletion.
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as FA from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { firebase } from './firebase';
import { APPLE_SIGN_IN_ENABLED, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID, isCloudConfigured, isGoogleConfigured } from './config';

export type Account = { uid: string; email: string | null; name: string | null; provider: 'apple' | 'google' | 'other' };

// Expo Go can't run native Google sign-in; it needs a real build of the app
export const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const toAccount = (u: FA.User): Account => {
  const p = u.providerData[0]?.providerId;
  return { uid: u.uid, email: u.email, name: u.displayName, provider: p === 'apple.com' ? 'apple' : p === 'google.com' ? 'google' : 'other' };
};

// Current signed-in account (null = signed out, undefined = still checking)
export function useAccount(): Account | null | undefined {
  const [acc, setAcc] = useState<Account | null | undefined>(isCloudConfigured() ? undefined : null);
  useEffect(() => {
    if (!isCloudConfigured()) return;
    return FA.onAuthStateChanged(firebase().auth, u => setAcc(u ? toAccount(u) : null));
  }, []);
  return acc;
}

// Inside Expo Go, Apple would issue the token to Expo Go instead of Fakka, so Firebase would reject it
export const appleAvailable = async () => APPLE_SIGN_IN_ENABLED && Platform.OS === 'ios' && !inExpoGo && (await AppleAuthentication.isAvailableAsync());

// Apple: ask Apple for a signed token (with a one-time nonce), hand it to Firebase
async function appleCredential() {
  const rawNonce = Crypto.randomUUID() + Crypto.randomUUID();
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  const res = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    nonce: hashed,
  });
  if (!res.identityToken) throw new Error('Apple did not return a token');
  const credential = new FA.OAuthProvider('apple.com').credential({ idToken: res.identityToken, rawNonce });
  const name = [res.fullName?.givenName, res.fullName?.familyName].filter(Boolean).join(' ');
  return { credential, authorizationCode: res.authorizationCode, name };
}

export async function signInWithApple() {
  const { credential, name } = await appleCredential();
  const { user } = await FA.signInWithCredential(firebase().auth, credential);
  // Apple only shares the name the very first time — save it on the account
  if (name && !user.displayName) await FA.updateProfile(user, { displayName: name }).catch(() => {});
  return toAccount(user);
}

// Google: native Google sheet → ID token → Firebase. Loaded lazily so Expo Go doesn't crash.
function google() {
  if (inExpoGo || !isGoogleConfigured()) return null;
  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });
    return GoogleSignin;
  } catch { return null; }
}
// On the web version (for testing in a browser), Google sign-in uses Firebase's own popup
export const googleAvailable = () => Platform.OS === 'web' || !!google();

async function googleCredential() {
  const G = google();
  if (!G) throw new Error('Google sign-in needs the full Fakka app (not Expo Go)');
  await G.hasPlayServices?.();
  const res = await G.signIn();
  if (res?.type === 'cancelled') throw Object.assign(new Error('cancelled'), { code: 'ERR_REQUEST_CANCELED' });
  const idToken = res?.data?.idToken ?? res?.idToken;
  if (!idToken) throw new Error('Google did not return a token');
  return FA.GoogleAuthProvider.credential(idToken);
}

export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    const { user } = await FA.signInWithPopup(firebase().auth, new FA.GoogleAuthProvider());
    return toAccount(user);
  }
  const { user } = await FA.signInWithCredential(firebase().auth, await googleCredential());
  return toAccount(user);
}

export async function signOut() {
  await FA.signOut(firebase().auth);
  await google()?.signOut?.().catch(() => {});
}

// Apple requires in-app account deletion. Deleting needs a fresh sign-in, so we ask again first.
// For Apple we also revoke Fakka's access at Apple, as Apple's guidelines ask.
export async function deleteAccount(deleteCloudData: (uid: string) => Promise<void>) {
  const { auth } = firebase();
  const user = auth.currentUser;
  if (!user) return;
  const provider = toAccount(user).provider;
  if (provider === 'apple') {
    const { credential, authorizationCode } = await appleCredential();
    await FA.reauthenticateWithCredential(user, credential);
    if (authorizationCode) await FA.revokeAccessToken(auth, authorizationCode).catch(() => {});
  } else if (provider === 'google') {
    if (Platform.OS === 'web') await FA.reauthenticateWithPopup(user, new FA.GoogleAuthProvider());
    else await FA.reauthenticateWithCredential(user, await googleCredential());
  }
  await deleteCloudData(user.uid);
  await user.delete();
  await google()?.revokeAccess?.().catch(() => {});
}

export const wasCancelled = (e: any) => e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request' || e?.code === 'ERR_REQUEST_CANCELED' || e?.code === 'ERR_CANCELED' || e?.message === 'cancelled' || e?.code === '-5' || e?.code === 'SIGN_IN_CANCELLED';
