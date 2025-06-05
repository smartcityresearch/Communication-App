import { Tabs } from 'expo-router';
import { useUser } from '../../context/userContext';
import { Image } from 'react-native';
import homeIcon from '../../assets/images/home.png';
import MessengerIcon from '../../assets/images/messenger.png';
import AdminIcon from '../../assets/images/admin.png';

export default function TabLayout() {
  const { user } = useUser();

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused, size }) => (
            <Image
              source={homeIcon}
              style={{
                width: size,
                height: size,
                tintColor: focused ? '#4a90e2' : '#999',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="messenger"
        options={{
          headerShown: false,
          tabBarLabel: "Messenger",
          // href: !(user?.domain==='software')? null : "/messenger"
          tabBarIcon: ({ focused, size }) => (
            <Image
              source={MessengerIcon}
              style={{
                width: 60,
                height: 60,
                tintColor: focused ? '#4a90e2' : '#999',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          headerShown: false,
          tabBarLabel: "admin",
          href: !(user?.domain==='admin ') ? null : "/admin",
          tabBarIcon: ({ focused, size }) => (
            <Image
              source={AdminIcon}
              style={{
                width: 40,
                height: 40,
                tintColor: focused ? '#4a90e2' : '#999',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
