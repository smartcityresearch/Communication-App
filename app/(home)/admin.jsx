import { useState } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { supabase } from '../../lib/supabase';
import styles from '../../styles/admin'

const Admin = () => {
  const [key, setKey] = useState(''); //tracks if key generated
  const [isPressed, setIsPressed] = useState(false); //tracks if generated button pressed

  const generateKey = async () => {
    setIsPressed(true); //to disable button and prevent multiple clicks
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    //generate random 8 character alphanumeric password
    const charactersLength = characters.length;
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    setKey(result);

    //insert into supabase keys table
    const {error } = await supabase
      .from('keys')
      .insert([{ key: result, used: false }]);

    if (error) {
      console.error('Error inserting key:', error);
    } else {
      console.log('Inserted key');
    }
    //can enable button again
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
        {/* displays key if successfully generated*/}
      {key ? (
        <Text style={styles.keyText}>Generated Key: <Text style={styles.keyValue}>{key}</Text></Text>
      ) : null}
      {/* Clear button only enabled when key is present on screen*/}
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

