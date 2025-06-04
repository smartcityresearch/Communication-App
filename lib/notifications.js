import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

const API_URL = 'http://192.168.26.66:3000';

let foregroundUnsubscribe = null;

// Request notification permissions
export async function requestNotificationPermissions() {
  try {
    await notifee.requestPermission();
    await messaging().requestPermission();
  } catch (error) {
    console.error('Error requesting permissions:', error);
  }
}

// Get FCM token
export async function getFCMToken(domain) {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    if(domain){
      await messaging().subscribeToTopic(`${domain}`);
      console.log(`Subscribed to topic: ${domain}`);
    }else{
      console.warn('Domain is not provided, skipping topic subscription.');
    }
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Handle foreground notifications - Setup once
export function setupForegroundNotifications() {
  // Prevent multiple listeners
  if (foregroundUnsubscribe) {
    return foregroundUnsubscribe;
  }

  foregroundUnsubscribe = messaging().onMessage(async remoteMessage => {
    const { notification, data } = remoteMessage;
    
    if (notification) {
      await notifee.displayNotification({
        title: notification.title,
        body: notification.body,
        android: {
          channelId: 'default',
          importance: AndroidImportance.HIGH,
          //  sound: 'meeting',
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

  return foregroundUnsubscribe;
}

// Handle background/quit state notifications
export function setupBackgroundNotifications() {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background message received:', remoteMessage);
    // Background notifications are handled by FCM automatically
  });
}

// Global notification interaction handler - Setup once
let interactionHandlerSetup = false;

export function setupNotificationInteractionHandler() {
  if (interactionHandlerSetup) {
    return;
  }

  interactionHandlerSetup = true;

  // Handle foreground events
  notifee.onForegroundEvent(({ type, detail }) => {
    console.log('Foreground event:', type, detail);
    
    if ((type === EventType.ACTION_PRESS && detail.pressAction?.id === 'mark-read') ||
  (type === EventType.PRESS && detail.pressAction?.id === 'default')) {
      const notificationId = detail.notification?.data?.notification_id;
      if (notificationId) {
        markNotificationAsRead(notificationId);
      }
    }
  });

  // Handle background events
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.log('Background event:', type, detail);
    
    if ((type === EventType.ACTION_PRESS && detail.pressAction?.id === 'mark-read') ||
  (type === EventType.PRESS && detail.pressAction?.id === 'default')) {
      const notificationId = detail.notification?.data?.notification_id;
      if (notificationId) {
        await markNotificationAsRead(notificationId);
      }
    }
  });

  // Handle app launch from notification
 notifee.getInitialNotification().then(async initialNotification => {
  if (initialNotification) {
    console.log('App launched from notification:', initialNotification);
    const pressId = initialNotification.pressAction?.id;
    const notificationId = initialNotification.notification?.data?.notification_id;

    if (
      (pressId === 'default' || pressId === 'mark-read') &&
      notificationId
    ) {
      await markNotificationAsRead(notificationId);
      
    }
  }
});
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
