import { Button, Text, TextInput, View, TouchableWithoutFeedback} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useUser } from '../context/userContext';
import { getFCMToken } from '../lib/notifications';
import styles from '../styles/landing'

export default function Index() {
  const [name, setName] = useState('');  //user name
  const [domain, setDomain] = useState(''); //user domain
  const [accessKey, setAccessKey] = useState(''); //verification key
  const [keyError, setKeyError] = useState(''); //checks error in verification key
  const [keyVerified, setKeyVerified] = useState(false); //checks key verified
  const router = useRouter(); //react native router for navigation
  const [loading, setLoading] = useState(false); //to st processing states
  const { setUser } = useUser(); //user context to persist entered data across screens
  const pickerRef = useRef(); //picker reference to select domain
  const domainLabelMap = {
  software: 'Software',
  hardware: 'Hardware',
  admin: 'Admin',
};


  useEffect(() => {
    //check if user already exists in local storage, if yes then navigate to home page.
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
    //additional safety check- user must have entered both verification key and selected domain
    if (!accessKey.trim() || !domain.trim()) {
      setKeyError('Please enter both domain and key');
      return;
    }

    setLoading(true);
    try {
      //sends req to backend where key is validated from database.
      const response = await fetch('http://192.168.19.66:3000/verify-key', {
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
        //key validated successfully
        setKeyError('');
        setKeyVerified(true);
      } else {
        //key validation unsuccessful
        setKeyError(result.error || 'Invalid key');
        setKeyVerified(false);
      }
    } catch (error) {
      //request could not be completed.
      console.error('Error verifying key:', error);
      setKeyError('Error verifying key. Please try again.');
      setKeyVerified(false);
    } finally {
      //stops processing/loading state
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    //validates that no empty field
    if (!name.trim() || !domain.trim() || !keyVerified || loading) return;
    
    setLoading(true);
    try {
      //generates unique fcm token for device.
      const fcmToken = await getFCMToken(domain.trim());
      //object for storing user details in context.
      const userData = {
        name: name.trim(),
        domain: domain.trim(),
        fcm_token: fcmToken,
      };
      //sending user data to users table in supabase database.
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      //error handling
      if (error) {
        console.error('Error inserting data:', error);
        alert('Error creating account. Please try again.');
      } else {
        //stores user data in local storage as well as user context.
        await AsyncStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        console.log('User data submitted successfully with ID:', data.id);
        //navigates to home screen [(home)/index.jsx]
        router.replace('(home)');
      }
    } catch (error) {
      //error handling
      console.error('Error in handleSubmit:', error);
      alert('Error creating account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  //function to generate custom text to enter security key based on user domain
  const getKeyPlaceholder = () => {
    if (domain === 'admin') {
      return 'Enter admin key';
    } else if (domain === 'software' || domain === 'hardware') {
      return 'Ask admin for your access key';
    }
    //additional safety check-if no domain selected
    return 'Select domain first';
  };

  //controls when submit button will be active/disabled, ie, when empty fields or key unverified or loading state..
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
    {/* Creates picker for selecting domain */}
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
     {/* Picker options */}
    <Picker.Item label="Select your domain..." value="" />
    <Picker.Item label="Software" value="software" />
    <Picker.Item label="Hardware" value="hardware" />
    <Picker.Item label="Admin" value="admin" />
  </Picker>
</View>
 {/* Verify key option only visible when domain is selected */}
      {domain && (
        <>
          <Text style={styles.label}>Access Key</Text>
          <TextInput 
            style={styles.input}
            placeholder={getKeyPlaceholder()}
            value={accessKey}
            onChangeText={setAccessKey} 
          />
           {/* Disables button when in loading state or if no key entered or if already verified key */}
          <Button 
            title={loading ? 'Verifying...' : 'Verify Key'} 
            onPress={verifyKey} 
            disabled={loading || !accessKey.trim() || keyVerified}
          />
           {/* Error text in case of invalid or success text if verified*/}
          {keyError?(
            <Text style={styles.errorText}>{keyError}</Text>):null} 
          {keyVerified ? (
                      <Text style={styles.successText}>✓ Key verified successfully</Text>
                    ) : null}
        </>
      )}
       {/* Main submit button */}
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