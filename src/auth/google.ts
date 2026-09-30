// Phone version (iOS / Android). Real Google sign-in needs a development build,
// so on phones the button stays "coming soon" for now. The browser version lives in google.web.ts.
export type GoogleUser = { uid: string; name: string; email: string };

export const googleAvailable = false;
export async function signInWithGoogle(): Promise<GoogleUser> {
  throw new Error('unavailable');
}
export async function signOutGoogle() {}
export function onGoogleUser(_cb: (u: GoogleUser | null) => void): () => void { return () => {}; }
