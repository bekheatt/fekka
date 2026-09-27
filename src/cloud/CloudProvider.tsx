// Connects sign-in and cloud sync to the app. Wraps the app inside the store Provider.
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useStore } from '../store';
import { t } from '../i18n';
import { isCloudConfigured } from './config';
import { Account, useAccount, signOut as authSignOut, deleteAccount as authDelete } from './auth';
import { downloadDocs, upload, joinDocs, markSynced, hasData, sameData, deleteCloudData } from './sync';
import { ask, tell } from './ask';

export type SyncStatus = 'off' | 'checking' | 'syncing' | 'synced' | 'error';
type Ctx = {
  enabled: boolean; account: Account | null | undefined; status: SyncStatus; lastSynced?: Date;
  syncNow: () => Promise<void>; signOut: () => void; deleteAccount: () => Promise<void>;
};
const Cloud = createContext<Ctx>({ enabled: false, account: null, status: 'off', syncNow: async () => {}, signOut: () => {}, deleteAccount: async () => {} });
export const useCloud = () => useContext(Cloud);

export function CloudProvider({ children }: { children: React.ReactNode }) {
  const { d, set, reset } = useStore();
  const account = useAccount();
  const [status, setStatus] = useState<SyncStatus>(isCloudConfigured() ? 'checking' : 'off');
  const [lastSynced, setLastSynced] = useState<Date>();
  const ready = useRef<string | null>(null); // uid whose first sync has finished
  const latest = useRef(d); latest.current = d;

  const push = async (force = false) => {
    const uid = account?.uid;
    if (!uid || ready.current !== uid) return;
    setStatus('syncing');
    try { await upload(uid, latest.current, force); setStatus('synced'); setLastSynced(new Date()); }
    catch { setStatus('error'); }
  };

  // First sync after signing in: decide which copy wins
  useEffect(() => {
    if (!account) { ready.current = null; if (account === null) setStatus('off'); return; }
    let alive = true;
    (async () => {
      setStatus('syncing');
      try {
        const uid = account.uid;
        const docs = await downloadDocs(uid);
        const cloudHas = Object.values(docs).some(x => Array.isArray(x.items) ? x.items.length > 0 : x.items && Object.keys(x.items).length > 0 && Object.values(x.items).some(v => v != null));
        const local = latest.current;
        const useCloud = () => {
          const joined = joinDocs(docs, local);
          joined.settings = { ...joined.settings, onboarded: joined.settings.onboarded || hasData(joined) };
          set(() => joined);
          return markSynced(uid, joined);
        };
        const finish = () => { if (!alive) return; ready.current = uid; setStatus('synced'); setLastSynced(new Date()); };

        if (!cloudHas) { ready.current = uid; await upload(uid, local, true); return finish(); }
        if (!hasData(local)) { await useCloud(); return finish(); }
        if (sameData(local, docs)) { await markSynced(uid, local); return finish(); }
        // Both sides have different data: let the person choose
        ask(t('Which data should Fakka keep?'), t('This phone and your account have different data.'), [
          { text: t('Use my account data'), onPress: async () => { await useCloud(); finish(); } },
          { text: t("Keep this phone's data"), onPress: async () => { ready.current = uid; await upload(uid, latest.current, true); finish(); } },
        ]);
      } catch { if (alive) setStatus('error'); }
    })();
    return () => { alive = false; };
  }, [account?.uid]);

  // Upload changes a couple of seconds after they happen
  useEffect(() => {
    if (!account || ready.current !== account.uid) return;
    const id = setTimeout(() => push(), 2500);
    return () => clearTimeout(id);
  }, [d]);

  // …and when the app goes to the background
  useEffect(() => {
    const sub = AppState.addEventListener('change', st => { if (st === 'background') push(); });
    return () => sub.remove();
  }, [account?.uid]);

  // Sign out: make sure everything is backed up, then clear this phone (it's a finance app — privacy first)
  const signOut = () => {
    ask(t('Sign out?'), t('Your data is backed up to your account and will be removed from this phone. Sign in again to get it back.'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Sign out'), style: 'destructive', onPress: async () => {
        try { if (account && ready.current === account.uid) await upload(account.uid, latest.current); }
        catch { return tell(t("Couldn't back up"), t('Connect to the internet and try again, so nothing is lost.')); }
        ready.current = null;
        await authSignOut();
        reset();
      } },
    ]);
  };

  const deleteAccount = async () => {
    await authDelete(deleteCloudData);
    ready.current = null;
    reset();
  };

  return (
    <Cloud.Provider value={{ enabled: isCloudConfigured(), account, status, lastSynced, syncNow: () => push(true), signOut, deleteAccount }}>
      {children}
    </Cloud.Provider>
  );
}
