import { Text, Button } from "react-native"
import { useState } from "react";
import { supabase } from '../../lib/supabase';

const admin = () => {
    const [key, setKey] = useState('');
    const [isPressed, setIsPressed] = useState(false);
    const generateKey= async () => {
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
        .insert([
    { key: result, used: false }
        ]);

if (error) {
  console.error('Error inserting key:', error);
} else {
  console.log('Inserted key');
}
        setIsPressed(false);
}

  return (
    <>
    <Text style={{margin: 50}}>admin</Text>
    <Button title="Generate Key" onPress={generateKey} disabled={isPressed} />
    {key && <Text>Generated Key: {key}</Text>}
    <Button title='Clear' onPress={() => setKey('')} />
    </>
  )
}

export default admin