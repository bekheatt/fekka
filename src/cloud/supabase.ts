// Fakka's online account + database (Supabase).
// The key below is the "publishable" key: it's meant to live inside the app.
// Privacy comes from the database rules: each signed-in person can only read and write their own row.
import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://udvgikxsawdslrddpbms.supabase.co';
const SUPABASE_KEY = 'sb_publishable_HD7QOMCgLTa1pF55roNwFg_ZYRAIMqp';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
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

// ---------- The user's data: one private row per person ----------
export async function loadUserData(uid: string): Promise<object | null> {
  const { data, error } = await supabase.from('user_data').select('data').eq('user_id', uid).maybeSingle();
  if (error) throw error;
  return (data?.data as object) ?? null;
}

export async function saveUserData(uid: string, appData: object): Promise<void> {
  const { error } = await supabase.from('user_data')
    .upsert({ user_id: uid, data: appData, updated_at: new Date().toISOString() });
  if (error) throw error;
}
