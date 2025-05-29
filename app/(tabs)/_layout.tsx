import { setupForegroundNotifications } from '@/lib/notifications';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';

export default function TabLayout() {
  useEffect(() => {
  setupForegroundNotifications();
}, []);
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home'}}
      />
    </Tabs>
  );
}
