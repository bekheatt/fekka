// Which versions of the Terms and Privacy Policy someone accepted, when, and how they came in.
// Kept in settings (so the app knows when to ask again) and, for accounts, in Supabase legal_consents.
import { Platform } from 'react-native';
import app from '../../../app.json';
import { PRIVACY_VERSION, TERMS_VERSION } from './documents';

export type ConsentVia = 'email' | 'google' | 'apple' | 'guest' | 'update';
export type Consent = { terms: string; privacy: string; at: string; via?: ConsentVia };

// `at` is the moment the box was ticked
export const newConsent = (at: string, via: ConsentVia): Consent => ({ terms: TERMS_VERSION, privacy: PRIVACY_VERSION, at, via });

// Accepted the versions in this build of the app
export const isCurrent = (c?: Consent) => !!c && c.terms === TERMS_VERSION && c.privacy === PRIVACY_VERSION;

export const APP_VERSION: string = app.expo.version;
export const PLATFORM = Platform.OS;
