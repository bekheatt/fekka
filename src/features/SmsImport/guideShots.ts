// Real iPhone screenshots for the Shortcuts guide, one per step (see ShortcutGuide.tsx).
// Add each one here once its file is in assets/shortcut-guide/. Steps without a picture show a placeholder.
import type { ImageSourcePropType } from 'react-native';

export type ShotKey =
  | 'home' | 'automation' | 'new' | 'message' | 'contains' | 'run' | 'blank'
  | 'search' | 'paste' | 'post' | 'field' | 'key' | 'done' | 'try';

export const SHOTS: Partial<Record<ShotKey, ImageSourcePropType>> = {
  // home: require('../../../assets/shortcut-guide/home.png'),
};
