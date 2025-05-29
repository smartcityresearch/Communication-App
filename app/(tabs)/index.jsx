//(tabs)/index.jsx
import { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { useUser } from '../../context/userContext';
import { supabase } from '../../lib/supabase';
import notifee, { EventType } from '@notifee/react-native';

const API_URL = 'http://192.168.86.66:3000'; // Change to your server address

export default function Index() {
  const { user } = useUser();
  const { setUser } = useUser();
  const [members, setMembers] = useState([]);
  const [pingStatus, setPingStatus] = useState({});

  // Fetch members and initial ping status
  useEffect(() => {
    const fetchData = async () => {
      // Get all users
      const { data: users } = await supabase.from('users').select('*');
      setMembers(users || []);

      // Get existing pings
      const { data: pings } = await supabase
        .from('notifications')
        .select('*')
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`);

      // Initialize status
      const statusMap = {};
      pings?.forEach(ping => {
        if (ping.sender_id === user?.id && ping.status === 'read_ack') {
          statusMap[ping.recipient_id] = 'read';
        }
      });
      setPingStatus(statusMap);
    };
    fetchData();
  }, [user]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase.channel('realtime-pings')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${user?.id}`
      }, (payload) => {
        if (payload.new.status === 'read_ack') {
          setPingStatus(prev => ({
            ...prev,
            [payload.new.sender_id]: 'read'
          }));
        }
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user]);

  // Handle notification actions from global handler
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'mark-read') {
        const notificationId = detail.notification?.data?.notification_id;
        if (notificationId) {
          // Mark as read on backend
          console.log(API_URL);
          fetch(`${API_URL}/mark-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notification_id: notificationId })
          });
        }
      }
      const checkUser = async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
      }
    };
    checkUser();
    });

    return unsubscribe;
  }, []);

  const sendPing = async (recipientId) => {
    try {
      // Update status optimistically
      setPingStatus(prev => ({
        ...prev,
        [recipientId]: 'sent'
      }));

      const response = await fetch(`${API_URL}/send-ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sender_id: user?.id, 
          recipient_id: recipientId 
        })
      });

      if (!response.ok) {
        // Revert status on failure
        setPingStatus(prev => ({
          ...prev,
          [recipientId]: undefined
        }));
        throw new Error('Failed to send ping');
      }
    } catch (error) {
      console.error('Ping failed:', error);
    }
  };

  const getStatusIcon = (userId) => {
    switch (pingStatus[userId]) {
      case 'sent': return <Text>✓</Text>;
      case 'read': return <Text style={{ color: 'green' }}>✓✓</Text>;
      default: return null;
    }
  };

  return (
    <View style={{ padding: 16 }}>
      {members.map(member => (
        <View key={member.id} style={{ marginBottom: 16 }}>
          <Text>{member.name} ({member.domain})</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Button 
              title="Ping" 
              onPress={() => sendPing(member.id)} 
              // disabled={member.id === user?.id}
            />
            {getStatusIcon(member.id)}
          </View>
        </View>
      ))}
    </View>
  );
}
