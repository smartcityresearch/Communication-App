import { Button, Text, TextInput, View, TouchableWithoutFeedback, Keyboard} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useUser } from '../context/userContext';
import { getFCMToken } from '../lib/notifications';
import styles from '../styles/landing'

export default function Index() {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [keyVerified, setKeyVerified] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setUser } = useUser();
  const pickerRef = useRef();
  const domainLabelMap = {
  software: 'Software',
  hardware: 'Hardware',
  admin: 'Admin',
};


  useEffect(() => {
    const checkUser = async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
          router.replace('(home)');
        }
      } catch (error) {
        console.error('Error checking stored user:', error);
      }
    };
    checkUser();
  }, []);

  // Reset key verification when domain changes
  useEffect(() => {
    setAccessKey('');
    setKeyError('');
    setKeyVerified(false);
  }, [domain]);

  const verifyKey = async () => {
    if (!accessKey.trim() || !domain.trim()) {
      setKeyError('Please enter both domain and key');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://192.168.26.66:3000/verify-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: accessKey.trim(),
          domain: domain.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setKeyError('');
        setKeyVerified(true);
      } else {
        setKeyError(result.error || 'Invalid key');
        setKeyVerified(false);
      }
    } catch (error) {
      console.error('Error verifying key:', error);
      setKeyError('Error verifying key. Please try again.');
      setKeyVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !domain.trim() || !keyVerified || loading) return;
    
    setLoading(true);
    try {
      const fcmToken = await getFCMToken(domain.trim());
      
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
        router.replace('(home)');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('Error creating account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getKeyPlaceholder = () => {
    if (domain === 'admin') {
      return 'Enter admin key';
    } else if (domain === 'software' || domain === 'hardware') {
      return 'Ask admin for your access key';
    }
    return 'Select domain first';
  };

  const isSubmitDisabled = loading || !name.trim() || !domain.trim() || !keyVerified;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome! Please enter your details:</Text>
      
      <Text style={styles.label}>Name</Text>
      <TextInput 
        style={styles.input}
        placeholder='Enter your name' 
        value={name}
        onChangeText={setName} 
      />
      
      <Text style={styles.label}>Domain</Text>
<View style={styles.pickerWrapper}>
  <TouchableWithoutFeedback onPress={() => pickerRef.current?.focus()}>
    <View style={styles.fakePicker}>
      <Text style={{ color: domain ? '#000' : '#888' }}>
        {domain ? domainLabelMap[domain] : 'Select your domain...'}
      </Text>
    </View>
  </TouchableWithoutFeedback>
  <Picker
    ref={pickerRef}
    selectedValue={domain}
    onValueChange={(itemValue) => setDomain(itemValue)}
    style={styles.actualPicker}
  >
    <Picker.Item label="Select your domain..." value="" />
    <Picker.Item label="Software" value="software" />
    <Picker.Item label="Hardware" value="hardware" />
    <Picker.Item label="Admin" value="admin" />
  </Picker>
</View>
      
      {domain && (
        <>
          <Text style={styles.label}>Access Key</Text>
          <TextInput 
            style={styles.input}
            placeholder={getKeyPlaceholder()}
            value={accessKey}
            onChangeText={setAccessKey} 
          />
          <Button 
            title={loading ? 'Verifying...' : 'Verify Key'} 
            onPress={verifyKey} 
            disabled={loading || !accessKey.trim() || keyVerified}
          />
          {keyError ? (
            <Text style={styles.errorText}>{keyError}</Text>
          ) : keyVerified ? (
            <Text style={styles.successText}>✓ Key verified successfully</Text>
          ) : null}
        </>
      )}
      
      <View style={styles.submitButtonContainer}>
        <Button 
          title={loading ? 'Submitting...' : 'Submit'} 
          onPress={handleSubmit} 
          disabled={isSubmitDisabled} 
        />
      </View>
    </View>
  );
}