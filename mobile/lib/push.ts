import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register the device for push notifications and post the Expo push token
 * to the backend. Backend currently stores it on the user (extend the user
 * model with `expoPushToken` to persist), and `notificationService` can use
 * Expo's push API to deliver alerts.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#243df5',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const { status: requested } = await Notifications.requestPermissionsAsync();
    status = requested;
  }
  if (status !== 'granted') return null;

  const projectId =
    (Notifications as any).projectId ||
    process.env.EXPO_PUBLIC_PROJECT_ID ||
    undefined;
  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  const token = tokenResult.data;

  // Send to backend if signed in
  try {
    await api.post('/users/me/push-token', { token, platform: Platform.OS });
  } catch {
    /* not signed in or endpoint not yet available */
  }

  return token;
}

/**
 * Listen for incoming notifications while the app is in foreground.
 * Returns a cleanup function.
 */
export function listenForPushNotifications(
  onReceive: (n: Notifications.Notification) => void
): () => void {
  const sub = Notifications.addNotificationReceivedListener(onReceive);
  return () => sub.remove();
}
