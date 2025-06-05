import { useState } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { supabase } from '../../lib/supabase';
import styles from '../../styles/admin'
const Admin = () => {
  const [key, setKey] = useState('');
  const [isPressed, setIsPressed] = useState(false);

  const generateKey = async () => {
    setIsPressed(true);
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    setKey(result);

    const { data, error } = await supabase
      .from('keys')
      .insert([{ key: result, used: false }]);

    if (error) {
      console.error('Error inserting key:', error);
    } else {
      console.log('Inserted key');
    }
    setIsPressed(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>

      <TouchableOpacity
        style={[styles.button, isPressed && styles.buttonDisabled]}
        onPress={generateKey}
        disabled={isPressed}
      >
        {isPressed ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Generate Key</Text>
        )}
      </TouchableOpacity>

      {key ? (
        <Text style={styles.keyText}>Generated Key: <Text style={styles.keyValue}>{key}</Text></Text>
      ) : null}

      <TouchableOpacity
        style={[styles.clearButton, !key && styles.buttonDisabled]}
        onPress={() => setKey('')}
        disabled={!key}
      >
        <Text style={styles.clearButtonText}>Clear</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Admin;

