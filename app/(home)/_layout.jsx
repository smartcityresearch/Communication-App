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
        name="messenger"
        options={{ headerShown: false, tabBarLabel: "Messenger",
        // href: !(user?.domain==='software')? null : "/messenger" 
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
