// Real iPhone screenshots for the Shortcuts guide (see ShortcutGuide.tsx).
// 600px-wide JPEGs in assets/shortcut-guide/, taken on iOS 26 in English with a dummy link (fakkaeg.com).
import type { ImageSourcePropType } from 'react-native';

export const SHOTS = {
  home: require('../../../assets/shortcut-guide/home.jpg'),             // home screen with the Shortcuts icon
  automation: require('../../../assets/shortcut-guide/automation.jpg'), // Automation tab, "New Automation"
  message: require('../../../assets/shortcut-guide/message.jpg'),       // trigger list, "Message"
  when: require('../../../assets/shortcut-guide/when.jpg'),             // Message Contains / Run Immediately / Next
  blank: require('../../../assets/shortcut-guide/blank.jpg'),           // "Create New Shortcut"
  search: require('../../../assets/shortcut-guide/search.jpg'),         // action search: Get Contents of URL
  paste: require('../../../assets/shortcut-guide/paste.jpg'),           // URL pasted
  options: require('../../../assets/shortcut-guide/options.jpg'),       // Method POST, Request Body JSON, Add new field
  fieldtype: require('../../../assets/shortcut-guide/fieldtype.jpg'),   // field type menu: Text
  key: require('../../../assets/shortcut-guide/key.jpg'),               // field named "text"
  input: require('../../../assets/shortcut-guide/input.jpg'),           // value: Shortcut Input
  try: require('../../../assets/shortcut-guide/try.jpg'),               // Fakka's "New from your bank" sheet
} satisfies Record<string, ImageSourcePropType>;

export type ShotKey = keyof typeof SHOTS;
