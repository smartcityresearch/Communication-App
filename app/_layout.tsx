import { UserProvider } from '../context/userContext'
import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { 
  setupForegroundNotifications, 
  setupBackgroundNotifications, 
  setupNotificationInteractionHandler, 
  requestNotificationPermissions, 
  createNotificationChannel 
} from '../lib/notifications';



export default function RootLayout() {
  //initialize and steup notification listener channels
  useEffect(() => {
    const initializeNotifications = async () => {
      await requestNotificationPermissions();
      await createNotificationChannel();
      
      // Setup notification handlers once at root level
      setupForegroundNotifications();
      setupBackgroundNotifications();
      setupNotificationInteractionHandler();
    };
    
    initializeNotifications();
  }, []);

  return (
    <UserProvider>
      <Slot />
    </UserProvider>
  );
}
