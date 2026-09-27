// Alert with buttons, plus a browser fallback (React Native's Alert does nothing on the web version)
import { Alert, Platform } from 'react-native';

type Btn = { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' };

export function ask(title: string, message: string, buttons: Btn[]) {
  if (Platform.OS !== 'web') return Alert.alert(title, message, buttons, { cancelable: false });
  const actions = buttons.filter(b => b.style !== 'cancel');
  if (actions.length === 1) { if (window.confirm(`${title}\n\n${message}`)) actions[0].onPress?.(); return; }
  // Two choices: OK picks the first, Cancel the second
  const pick = window.confirm(`${title}\n\n${message}\n\nOK = ${actions[0].text}\nCancel = ${actions[1].text}`);
  (pick ? actions[0] : actions[1]).onPress?.();
}
export const tell = (title: string, message = '') => (Platform.OS === 'web' ? window.alert(`${title}\n\n${message}`) : Alert.alert(title, message));
