import { Button, Text, TextInput, View, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useUser } from '../context/userContext';
import { getFCMToken } from '../lib/notifications';

export default function Index() {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setUser } = useUser();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
          router.replace('(tabs)');
        }
      } catch (error) {
        console.error('Error checking stored user:', error);
      }
    };
    checkUser();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || !domain.trim() || loading) return;
    
    setLoading(true);
    try {
      const fcmToken = await getFCMToken();
      
      const userData = {
        name: name.trim(),
        domain: domain.trim(),
        fcm_token: fcmToken,
      };

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting data:', error);
        alert('Error creating account. Please try again.');
      } else {
        await AsyncStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        console.log('User data submitted successfully with ID:', data.id);
        router.replace('(tabs)');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('Error creating account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome! Please enter your details:</Text>
      <TextInput 
        style={styles.input}
        placeholder='Name..' 
        value={name}
        onChangeText={setName} 
      />
      <TextInput 
        style={styles.input}
        placeholder='Domain..' 
        value={domain}
        onChangeText={setDomain} 
      />
      <Button 
        title={loading ? 'Submitting...' : 'Submit'} 
        onPress={handleSubmit} 
        disabled={loading || !name.trim() || !domain.trim()} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: 'white',
  },
});
