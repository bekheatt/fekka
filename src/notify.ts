import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Data, dueItems } from './store';
import { le } from './theme';
import { t } from './i18n';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function askPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('payments', { name: 'Payment reminders', importance: Notifications.AndroidImportance.HIGH });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

// Re-schedules every reminder: day before (10 AM) and due day (10 AM), monthly.
export async function scheduleReminders(d: Data) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!d.settings.notify) return;
    const items = dueItems(d);
    for (const it of items) {
      const body = t('Payment of {x}', { x: le(it.amount) });
      const monthly = (day: number) => ({ type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day, hour: 10, minute: 0, channelId: 'payments' } as const);
      if (it.day > 1) {
        await Notifications.scheduleNotificationAsync({ content: { title: t('{name} due tomorrow', { name: it.name }), body }, trigger: monthly(it.day - 1) });
      }
      await Notifications.scheduleNotificationAsync({ content: { title: t('{name} due today', { name: it.name }), body }, trigger: monthly(Math.min(it.day, 28)) });
    }
  } catch {
    // notifications unavailable (e.g. some Expo Go limits) — ignore quietly
  }
}
