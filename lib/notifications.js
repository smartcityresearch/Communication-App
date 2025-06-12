//File to setup notification handlers in foreground and background using notifee library

import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

const API_URL = 'http://192.168.19.66:3000';

let foregroundUnsubscribe = null;

export async function requestNotificationPermissions() {
  try {
    await notifee.requestPermission();
    await messaging().requestPermission();
  } catch (error) {
    console.error('Error requesting permissions:', error);
  }
}

export async function getFCMToken(domain) {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    if (domain) {
      await messaging().subscribeToTopic(`${domain}`);
      console.log(`Subscribed to topic: ${domain}`);
    } else {
      console.warn('Domain is not provided, skipping topic subscription.');
    }
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

export function setupForegroundNotifications() {
  if (foregroundUnsubscribe) return foregroundUnsubscribe;

  foregroundUnsubscribe = messaging().onMessage(async remoteMessage => {
    const { notification, data } = remoteMessage;
    if (notification) {
      await displayNotification(notification, data);
    }
  });

  return foregroundUnsubscribe;
}

export function setupBackgroundNotifications() {
  messaging().setBackgroundMessageHandler(async () => {
    // Handled automatically
  });
}

let interactionHandlerSetup = false;

export function setupNotificationInteractionHandler() {
  if (interactionHandlerSetup) return;
  interactionHandlerSetup = true;

  const handleInteraction = async (type, detail) => {
    const pressId = detail.pressAction?.id;
    const notificationId = detail.notification?.data?.notification_id;
    if ((pressId === 'default' || pressId === 'mark-read') && notificationId) {
      await markNotificationAsRead(notificationId);
    }
  };

  notifee.onForegroundEvent(({ type, detail }) => handleInteraction(type, detail));
  notifee.onBackgroundEvent(({ type, detail }) => handleInteraction(type, detail));

  notifee.getInitialNotification().then(async initialNotification => {
    if (initialNotification) {
      await handleInteraction(null, initialNotification);
    }
  });
}

async function markNotificationAsRead(notificationId) {
  try {
    const response = await fetch(`${API_URL}/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_id: notificationId })
    });
    if (response.ok) console.log('Notification marked as read');
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

async function displayNotification(notification, data) {
  await notifee.displayNotification({
    title: notification.title,
    body: notification.body,
    android: {
      channelId: 'default',
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default' },
      actions: [
        {
          title: 'Mark as Read',
          pressAction: { id: 'mark-read' },
        },
      ],
    },
    data,
  });
}

export async function createNotificationChannel() {
  try {
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      sound: 'meeting',
      vibration: true,
      lights: true,
      lightColor: '#FF0000',
    });
  } catch (error) {
    console.error('Error creating notification channel:', error);
  }
}
