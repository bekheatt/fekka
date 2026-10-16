// Tells the "Log Bank SMS" Shortcuts action where to send bank messages (null = turned off / signed out).
// Missing in Expo Go and on Android, where it does nothing.
import { requireOptionalNativeModule } from 'expo';

const native = requireOptionalNativeModule<{ setEndpoint(endpoint: string | null): void }>('FakkaShortcuts');

export const hasShortcutAction = !!native;

export function setShortcutEndpoint(endpoint: string | null) {
  try { native?.setEndpoint(endpoint); } catch {}
}
