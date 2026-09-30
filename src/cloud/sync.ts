// Phone version: no cloud database yet, everything stays on the phone.
// The browser version lives in sync.web.ts.
export const cloudAvailable = false;
export async function loadUserData(_uid: string): Promise<string | null> { return null; }
export async function saveUserData(_uid: string, _json: string): Promise<void> {}
