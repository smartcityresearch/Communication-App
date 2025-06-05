import { Tabs } from 'expo-router';
import { useUser } from '../../context/userContext';
  
export default function TabLayout() {
  
  const { user } = useUser();
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{ headerShown: false, tabBarLabel: "admin",
        href: !(user?.domain==='software')? null : "/admin" }}
      />
    </Tabs>
  );
}
