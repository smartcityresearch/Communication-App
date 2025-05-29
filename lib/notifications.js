//notifications.ts
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

const API_URL = 'http://192.168.86.66:3000'; // Change to your server address

// Request notification permissions
export async function requestNotificationPermissions() {
  await notifee.requestPermission();
  await messaging().requestPermission();
}

// Get FCM token
export async function getFCMToken() {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Handle foreground notifications
export function setupForegroundNotifications() {
  return messaging().onMessage(async remoteMessage => {
    const { notification, data } = remoteMessage;
    
    if (notification) {
      await notifee.displayNotification({
        title: notification.title,
        body: notification.body,
        android: {
          channelId: 'default',
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          actions: [
            {
              title: 'Mark as Read',
              pressAction: {
                id: 'mark-read',
              },
            },
          ],
        },
        data,
      });
    }
  });
}

// Handle background/quit state notifications
export function setupBackgroundNotifications() {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background message received:', remoteMessage);
    // Background notifications are handled by FCM automatically
    // We don't need to display them manually here
  });
}

// Global notification interaction handler (works for all notification states)
export function setupNotificationInteractionHandler() {
  // Handle foreground events
  const foregroundUnsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
    console.log('Foreground event:', type, detail);
    
    if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'mark-read') {
      const notificationId = detail.notification?.data?.notification_id;
      if (notificationId) {
        markNotificationAsRead(notificationId);
      }
    }
  });

  // Handle background events (when app is in background but not killed)
  const backgroundUnsubscribe = notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.log('Background event:', type, detail);
    
    if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'mark-read') {
      const notificationId = detail.notification?.data?.notification_id;
      if (notificationId) {
        await markNotificationAsRead(notificationId);
      }
    }
  });

  // Handle app launch from notification (when app was killed)
  notifee.getInitialNotification().then(initialNotification => {
    if (initialNotification) {
      console.log('App launched from notification:', initialNotification);
      // Handle the notification that launched the app
    }
  });

  return foregroundUnsubscribe;
  
}

// Helper function to mark notification as read
async function markNotificationAsRead(notificationId) {
  try {
    const response = await fetch(`${API_URL}/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_id: notificationId })
    });
    
    if (response.ok) {
      console.log('Notification marked as read');
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Create notification channel (Android)
export async function createNotificationChannel() {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
}