// Fakka's online account + database (Supabase).
// The key below is the "publishable" key: it's meant to live inside the app.
// Privacy comes from the database rules: each signed-in person can only read and write their own row.
import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

const SUPABASE_URL = 'https://udvgikxsawdslrddpbms.supabase.co';
const SUPABASE_KEY = 'sb_publishable_HD7QOMCgLTa1pF55roNwFg_ZYRAIMqp';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce' },
});

// Keep the sign-in fresh only while the app is open (recommended for phones)
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', st => {
    if (st === 'active') supabase.auth.startAutoRefresh(); else supabase.auth.stopAutoRefresh();
  });
}

export type CloudUser = { uid: string; email: string };

// Returns the user, or null when the account still needs its email confirmed
export async function signInEmail(email: string, password: string): Promise<CloudUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return { uid: data.user.id, email: data.user.email ?? email };
}

export async function signUpEmail(email: string, password: string): Promise<CloudUser | null> {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) throw error;
  if (!data.session || !data.user) return null; // confirmation email sent
  return { uid: data.user.id, email: data.user.email ?? email };
}

// Google: opens Google's sign-in page in a secure browser, then comes back into the app.
// Returns null if the person closed the page.
export async function signInGoogle(): Promise<CloudUser | null> {
  // In Expo Go the app's address contains the laptop's network number (exp://192.168.x.x:8081/...),
  // which Supabase refuses. The sign-in window only needs the "exp://" part to catch the return,
  // so we use a fixed address there. Real app builds use fakka:// and are unaffected.
  const own = Linking.createURL('auth-callback');
  const redirectTo = own.startsWith('exp://') ? 'exp://fakka/--/auth-callback' : own;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
  });
  if (error) throw error;
  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success') return null;
  const url = new URL(res.url);
  const params = new URLSearchParams(url.hash.replace(/^#/, ''));
  url.searchParams.forEach((v, k) => params.set(k, v));
  const problem = params.get('error_description') ?? params.get('error');
  if (problem) throw new Error(problem);
  const code = params.get('code');
  if (!code) throw new Error('Google did not finish signing in. Please try again.');
  const { data: s, error: e2 } = await supabase.auth.exchangeCodeForSession(code);
  if (e2) throw e2;
  return { uid: s.user.id, email: s.user.email ?? '' };
}

export async function signOutCloud() {
  await supabase.auth.signOut().catch(() => {});
}

// Who is signed in right now (remembered between app launches)
export function onCloudUser(cb: (u: CloudUser | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_e, session) => {
    cb(session?.user ? { uid: session.user.id, email: session.user.email ?? '' } : null);
  });
  return () => data.subscription.unsubscribe();
}

// ---------- The user's data: one private row per person, with a version number ----------
export type Row = { data: any; rev: number };

export async function loadUserData(uid: string): Promise<Row | null> {
  const { data, error } = await supabase.from('user_data').select('data, rev').eq('user_id', uid).maybeSingle();
  if (error) throw error;
  return data ? { data: data.data, rev: Number(data.rev) } : null;
}

// Saves only if no other phone saved since version `baseRev`.
// Returns the new version number, or -1 if another phone got there first.
export async function saveUserData(appData: object, baseRev: number): Promise<number> {
  const { data, error } = await supabase.rpc('save_user_data', { p_data: appData, p_base_rev: baseRev });
  if (error) throw error;
  return Number(data);
}

// Permanently deletes the signed-in person's account and all their saved data from the server.
// Signing in again afterwards starts a brand-new account.
export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
}
