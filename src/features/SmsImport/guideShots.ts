// Real iPhone screenshots for the Shortcuts guide (see ShortcutGuide.tsx).
// 750px-wide JPEGs in assets/shortcut-guide/, taken on iOS 26 in English, light mode.
import type { ImageSourcePropType } from 'react-native';

export const SHOT_RATIO = 828 / 1792; // the screenshots' width / height

export const SHOTS = {
  automation: require('../../../assets/shortcut-guide/automation.jpg'), // Automation tab, "New Automation"
  message: require('../../../assets/shortcut-guide/message.jpg'),       // trigger list, "Message"
  choose: require('../../../assets/shortcut-guide/choose.jpg'),         // Message Contains: Choose
  contains: require('../../../assets/shortcut-guide/contains.jpg'),     // "EGP" typed, Done
  when: require('../../../assets/shortcut-guide/when.jpg'),             // Run Immediately, Next
  blank: require('../../../assets/shortcut-guide/blank.jpg'),           // "Create New Shortcut"
  search: require('../../../assets/shortcut-guide/search.jpg'),         // search "fakka": Log Bank SMS
  input: require('../../../assets/shortcut-guide/input.jpg'),           // Message → Shortcut Input
  saved: require('../../../assets/shortcut-guide/saved.jpg'),           // "Log Shortcut Input in Fakka", ✓
} satisfies Record<string, ImageSourcePropType>;

export const SHORTCUTS_ICON = require('../../../assets/shortcut-guide/shortcuts-icon.png');

export type ShotKey = keyof typeof SHOTS;
