import { Tabs } from 'expo-router';
import { useUser } from '../../context/userContext';
import { Image } from 'react-native';
import homeIcon from '../../assets/images/home.png';
import MessengerIcon from '../../assets/images/messenger.png';
import AdminIcon from '../../assets/images/admin.png';

const HomeTabIcon = ({ focused, size }) => (
<Image
  source={homeIcon}
  style={{
    width: size,
    height: size,
    tintColor: focused ? '#4a90e2' : '#999',
  }}
  resizeMode="contain"
/>
);

const adminTabIcon= ({ focused, size }) => (
            <Image
              source={AdminIcon}
              style={{
                width: 40,
                height: 40,
                tintColor: focused ? '#4a90e2' : '#999',
              }}
              resizeMode="contain"
            />
          );

const MessengerTabIcon = ({ focused, size }) => (
            <Image
              source={MessengerIcon}
              style={{
                width: 60,
                height: 60,
                tintColor: focused ? '#4a90e2' : '#999',
              }}
              resizeMode="contain"
            />
);


export default function TabLayout() {
  const { user } = useUser();


  return (
    <Tabs>
      {/* Main home page */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: HomeTabIcon
        }}
      />
  {/* SCRC Messenger page */}
      <Tabs.Screen
        name="messenger"
        options={{
          headerShown: false,
          tabBarLabel: "Messenger",
          tabBarIcon: MessengerTabIcon
        }}
      />
    {/* Admin panel with restricted access */}
      <Tabs.Screen
        name="admin"
        options={{
          headerShown: false,
          tabBarLabel: "admin",
          href: (user?.domain!=='admin') ? null : "/admin",
          tabBarIcon: adminTabIcon
        }}
      />
    </Tabs>
  );
}
