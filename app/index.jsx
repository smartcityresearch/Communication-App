//index.jsx
import { Button, Text, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useUser } from '../context/userContext';
import { 
  getFCMToken, 
  requestNotificationPermissions, 
  createNotificationChannel,
  setupForegroundNotifications,
  setupBackgroundNotifications,
  setupNotificationInteractionHandler
} from '../lib/notifications';

export default function Index() {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setUser } = useUser();

  useEffect(() => {
    const initializeNotifications = async () => {
      await requestNotificationPermissions();
      await createNotificationChannel();
      
      // Setup notification handlers
      setupForegroundNotifications();
      setupBackgroundNotifications();
      setupNotificationInteractionHandler();
    };
    initializeNotifications();

    const checkUser = async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        router.replace('(tabs)');
      }
    };
    checkUser();
  }, []);

  const handleSubmit = async () => {
  setLoading(true);
  if (!name || !domain || loading) return;

  try {
    const fcmToken = await getFCMToken();
    
    const userData = {
      name,
      domain,
      fcm_token: fcmToken,
    };

    // Get the inserted data back with the generated ID
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()  // This tells Supabase to return the inserted row
      .single(); // Get single object instead of array
    
    if (error) {
      console.error('Error inserting data:', error);
    } else {
      // Now 'data' contains the complete user object including the auto-generated ID
      await AsyncStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      console.log('User data submitted successfully with ID:', data.id);
      router.replace('(tabs)');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <TextInput placeholder='Name..' onChangeText={setName} />
      <TextInput placeholder='Domain..' onChangeText={setDomain} />
      <Button title={loading ? 'Submitting...' : 'Submit'} onPress={handleSubmit} disabled={loading} />
    </>
  );
}