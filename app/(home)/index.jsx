// (tabs)/index.jsx - Simplified with AsyncStorage tracking
import { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useUser } from '../../context/userContext';
import { supabase } from '../../lib/supabase';
import notifee, { EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../../styles/home.js'


const API_URL = 'http://192.168.19.66:3000';
const SENT_PINGS_KEY = 'sent_pings';

export default function Index() {
  const { user, setUser } = useUser();
  const [members, setMembers] = useState([]);
  const [sentPings, setSentPings] = useState([]);
  const [isPressed, setIsPressed] = useState(false);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [customMessage, setCustomMessage] = useState('');

  // Initialize user from AsyncStorage if context is lost
  useEffect(() => {
    const initializeUser = async () => {
      if (!user) {
        try {
          const stored = await AsyncStorage.getItem('user');
          if (stored) {
            const parsedUser = JSON.parse(stored);
            setUser(parsedUser);
          }
        } catch (error) {
          console.error('Error loading user from storage:', error);
        }
      }
    };
    initializeUser();
  }, [user, setUser]);

  // Load sent pings from AsyncStorage
  useEffect(() => {
    const loadSentPings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SENT_PINGS_KEY);
        if (stored) {
          const pings = JSON.parse(stored);
          setSentPings(pings);
        }
      } catch (error) {
        console.error('Error loading sent pings:', error);
      }
    };
    
    if (user?.id) {
      loadSentPings();
    }
  }, [user]);

  // Fetch members
  useEffect(() => {
    if (!user?.id) return;

    const fetchMembers = async () => {
      try {
        const { data: users } = await supabase
          .from('users')
          .select('*')
          // .neq('id', user.id);
        setMembers(users || []);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };

    fetchMembers();
  }, [user]);
useEffect(() => {
  if (!user?.id) return;

  console.log('Setting up realtime listener for user:', user.id);

  const channel = supabase
    .channel(`ping-reads-${user.id}`) // Unique channel
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `sender_id=eq.${Number(user.id)}`,
      },
      (payload) => {
        console.log('Realtime update received:', payload);
        if (payload.new.status === 'read') {
          console.log('Updating ping status to read for ID:', payload.new.id);
          updatePingStatus(payload.new.id.toString(), 'read');
        }
      }
    )
    .on('channel_error', (error) => {
    console.log('hmmmmmm');
    // handle reconnect here if you want
  })
    .subscribe((status, err) => {
      if (err) console.error('Subscription error:', err);
      console.log('Channel status:', status);
    });

  return () => {
    console.log('Unsubscribing from channel');
    channel.unsubscribe();
  };
}, [user?.id]); // Only re-run if user.id changes

  // Handle notification actions
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'mark-read') {
        const notificationId = detail.notification?.data?.notification_id;
        if (notificationId) {
          fetch(`${API_URL}/mark-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notification_id: notificationId })
          }).catch(error => console.error('Error marking as read:', error));
        }
      }
    });

    return unsubscribe;
  }, [user]);

  const saveSentPings = async (pings) => {
    try {
      await AsyncStorage.setItem(SENT_PINGS_KEY, JSON.stringify(pings));
      setSentPings(pings);
    } catch (error) {
      console.error('Error saving sent pings:', error);
    }
  };

const updatePingStatus = async (notificationId, status) => {
  try {
    console.log('Attempting to update status for:', notificationId);
    const stored = await AsyncStorage.getItem(SENT_PINGS_KEY);
    
    if (stored) {
      const pings = JSON.parse(stored);
      console.log('Current pings in storage:', pings);

      // Find the ping we're trying to update
      const pingToUpdate = pings.find(p => p.notificationId === notificationId);
      console.log('Found ping to update:', pingToUpdate);

      const updatedPings = pings.map(ping => 
        ping.notificationId === notificationId.toString() 
          ? { ...ping, status } 
          : ping
      );
      console.log('Looking for notificationId:', notificationId);
    console.log('Type of stored ID:', typeof pings[0]?.notificationId);
    console.log('Type of incoming ID:', typeof notificationId);
    console.log('Updated pings:', updatedPings);
      await saveSentPings(updatedPings);
      setSentPings(updatedPings);
    }else{
      console.log('Not stored bro..');
    }
  } catch (error) {
    console.error('Error updating ping status:', error);
  }
};

  const openPingModal = (recipient) => {
    setSelectedRecipient(recipient);
    setCustomMessage('');
    setModalVisible(true);
  };

const sendGroupPing = async (topic) =>{
  try {
    await fetch(`${API_URL}/send-group-ping`, {
       method: 'POST',
       headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({topic})
    });
    console.log('Sent group ping');
  } catch (error) {
    console.error('Error sending group ping:', error);
  }
};


const sendPing = async () => {
  if (!user?.id || !selectedRecipient) return;

  const message = customMessage.trim() || `Ping from ${user.name}`;

  try {
    setIsPressed(true);
    const response = await fetch(`${API_URL}/send-ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sender_id: user.id, 
        recipient_id: selectedRecipient.id,
        message: message
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send ping');
    }

    const result = await response.json();
    
    // DEBUG: Log the notification ID from server response
    console.log('Server response notification ID:', result.notification.id);
    console.log('Current user ID:', user.id);

    const newPing = {
      id: Date.now(),
      notificationId: result.notification.id,
      recipientName: selectedRecipient.name,
      message: message,
      timestamp: new Date().toLocaleString(),
      status: 'sent'
    };

    // DEBUG: Log before saving
    console.log('New ping being saved:', newPing);

    const updatedPings = [newPing, ...sentPings];
    await saveSentPings(updatedPings);
    setSentPings(updatedPings);

    setModalVisible(false);
    Alert.alert('Success', `Ping sent to ${selectedRecipient.name}!`);
  } catch (error) {
    console.error('Ping failed:', error);
    Alert.alert('Error', 'Failed to send ping. Please try again.');
  }finally {
    setIsPressed(false);
  }
};

  const clearAllPings = async () => {
    try {
      await AsyncStorage.removeItem(SENT_PINGS_KEY);
      setSentPings([]);
    } catch (error) {
      console.error('Error clearing pings:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <Text style={styles.singleTick}>✓</Text>;
      case 'read': return <Text style={styles.doubleTick}>✓✓</Text>;
      default: return null;
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>
      
      {/* Members List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Pings</Text>
             <View style={styles.buttonContainer}>
  <View style={styles.buttonWrapper}>
    <Button title='All Software' onPress={() => sendGroupPing('software')} />
  </View>
  <View style={styles.buttonWrapper}>
    <Button title='All Hardware' onPress={() => sendGroupPing('hardware')} />
  </View>
</View>
        {members.length === 0 ? (
          <Text>Loading...</Text>
        ) : (
          
          members.map(member => (
            <View key={member.id} style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberDomain}>({member.domain})</Text>
              </View>
              <Button 
                title="Ping" 
                onPress={() => openPingModal(member)} 
              />
            </View>
        )))}
      </View>
        {/* Temporary debug button */}
      {/* <Button 
        title="Debug Pings" 
        onPress={async () => {
          const stored = await AsyncStorage.getItem(SENT_PINGS_KEY);
          console.log('Current AsyncStorage contents:', stored);
        }} 
      /> */}
 
      {/* Sent Pings Section */}
      {sentPings.length > 0 && (
        <View style={styles.section}>
          <View style={styles.pingsHeader}>
            <Text style={styles.sectionTitle}>Sent Messages</Text>
            <TouchableOpacity onPress={clearAllPings}>
              <Text style={styles.clearAllButton}>Clear All</Text>
            </TouchableOpacity>
          </View>
          {sentPings.map(ping => (
            <View key={ping.id} style={styles.pingItem}>
              <View style={styles.pingInfo}>
                <Text style={styles.pingRecipient}>
                  To: {ping.recipientName}
                </Text>
                <Text style={styles.pingMessage}>
                  "{ping.message}"
                </Text>
                <Text style={styles.pingTime}>{ping.timestamp}</Text>
              </View>
              <View style={styles.pingStatus}>
                {getStatusIcon(ping.status)}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Custom Message Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Send Ping to {selectedRecipient?.name}
            </Text>
            
            <TextInput
              style={styles.messageInput}
              placeholder="Enter your message (optional)"
              value={customMessage}
              onChangeText={setCustomMessage}
              multiline
              maxLength={200}
            />
            
            <Text style={styles.charCount}>
              {customMessage.length}/200 characters
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.sendButton, isPressed && styles.disabledButton]} 
                onPress={sendPing}
                disabled={isPressed}
              >
                <Text style={styles.sendButtonText}>Send Ping</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

