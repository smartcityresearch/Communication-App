import { UserProvider } from '../context/userContext'
import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { setupForegroundNotifications, setupBackgroundNotifications, setupNotificationInteractionHandler } from '../lib/notifications';


export default function RootLayout() {
  useEffect(() => {
    setupForegroundNotifications();
    setupBackgroundNotifications();
    const unsubscribe = setupNotificationInteractionHandler();
    
    return () => unsubscribe();
  }, []);


  return (
    <UserProvider>
        <Slot />
    </UserProvider>
  );
}
