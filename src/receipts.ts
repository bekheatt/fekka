import * as ImagePicker from 'expo-image-picker';
import { File, Directory, Paths } from 'expo-file-system';
import { pauseLock } from './Lock';

// Takes or picks a receipt photo and keeps a private copy inside Fakka (never uploaded anywhere).
export async function pickReceipt(from: 'camera' | 'library'): Promise<string | null> {
  pauseLock(true);
  try {
    const perm = from === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6 };
    const r = from === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (r.canceled || !r.assets?.length) return null;
    const dir = new Directory(Paths.document, 'receipts');
    if (!dir.exists) dir.create({ intermediates: true });
    const dest = new File(dir, `${Date.now()}.jpg`);
    new File(r.assets[0].uri).copy(dest);
    return dest.uri;
  } catch {
    return null;
  } finally {
    setTimeout(() => pauseLock(false), 1500);
  }
}

// Every receipt photo Fakka saved on this phone (when deleting the account or all data)
export function deleteAllReceipts() {
  try { const dir = new Directory(Paths.document, 'receipts'); if (dir.exists) dir.delete(); } catch { /* nothing saved */ }
}

export function deleteReceipt(uri?: string) {
  if (!uri) return;
  try { const f = new File(uri); if (f.exists) f.delete(); } catch { /* already gone */ }
}
