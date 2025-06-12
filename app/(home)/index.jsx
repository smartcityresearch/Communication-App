import { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useUser } from '../../context/userContext';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../../styles/home.js'

//backend url
const API_URL = 'http://192.168.19.66:3000';
//constant defining name of notification data stored in localStorage(AsyncStorage)
const SENT_PINGS_KEY = 'sent_pings';

export default function Index() {
  const { user, setUser } = useUser(); //user context
  const [members, setMembers] = useState([]); //organization member data queried from database
  const [sentPings, setSentPings] = useState([]); //stores sent notifications
  const [isPressed, setIsPressed] = useState(false); //stores button state
  
  // Modal(popup on clicking ping buttons) states
  const [modalVisible, setModalVisible] = useState(false); //for indvidual ping modal
  const [selectedRecipient, setSelectedRecipient] = useState(null); //details of individual ping recipient
  const [customMessage, setCustomMessage] = useState(''); //custom message entered
  const [groupModalVisible, setGroupModalVisible] = useState(false); //for group ping modal
  const [selectedTopic, setSelectedTopic] = useState(''); //domain name for selecting firebase topic
  const [groupCustomMessage, setGroupCustomMessage] = useState(''); //group ping custom message entered

  // Initialize user from AsyncStorage if context is lost(safety measure in case of unexpected refreshes)
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

  // Load sent pings data from AsyncStorage
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

  // Fetch organization members from supabase
  useEffect(() => {
    if (!user?.id) return;

    const fetchMembers = async () => {
      try {
        const { data: users } = await supabase
          .from('users')
          .select('*')
          // .neq('id', user.id); //ignores user themselves(can comment out for testing)
        setMembers(users || []);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };

    fetchMembers();
  }, [user]);
useEffect(() => {
  if (!user?.id) return;
  console.log('Setting up realtime listener for user:', user.id); //unique supabase realtime listener to capture change in notification table(for read receipts)

  const channel = supabase
    .channel(`ping-reads-${user.id}`) // Unique realtime listening channel based on their id
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `sender_id=eq.${Number(user.id)}`, //will trigger when update in notifications table and a notification sent by that user's status changes to read
      },
      (payload) => {
        if (payload.new.status === 'read') {
          console.log('Updating ping status to read for ID:', payload.new.id);
          updatePingStatus(payload.new.id.toString(), 'read'); //updates status in localStorage
        }
      }
    )
    .subscribe((status, err) => {
      if (err) console.error('Subscription error:', err);
      console.log('Channel status:', status);
    });

  return () => {
    console.log('Unsubscribing from channel');
    channel.unsubscribe();
  };
}, [user?.id]); // Only re-run and re-subscribe to channel if user.id changes(will also trigger when app reloaded and id loads from context.Thus restarting app is a good way to fix issues if unable to receive mark as read updates)

  //saves sent pings in local storage
  const saveSentPings = async (pings) => {
    try {
      await AsyncStorage.setItem(SENT_PINGS_KEY, JSON.stringify(pings));
      setSentPings(pings);
    } catch (error) {
      console.error('Error saving sent pings:', error);
    }
  };
  //updates status of pings in local storage(essential for double tick(read) UI update)
const updatePingStatus = async (notificationId, status) => {
  try {
    console.log('Attempting to update status for:', notificationId);
    const stored = await AsyncStorage.getItem(SENT_PINGS_KEY);
    
    if (stored) {
      const pings = JSON.parse(stored);

      //store updated pings
      const updatedPings = pings.map(ping => 
        ping.notificationId === notificationId.toString() 
          ? { ...ping, status } 
          : ping
      );
      await saveSentPings(updatedPings);
      setSentPings(updatedPings);
    }
  } catch (error) {
    console.error('Error updating ping status:', error);
  }
};
  //Individual ping modal, default msg displayed is "come for meeting"
  const openPingModal = (recipient) => {
    setSelectedRecipient(recipient);
    setCustomMessage('Come for meeting');
    setModalVisible(true); //shows popup(modal)
  };
  //Group ping modal, default msg displayed is "{domain} meeting is starting!"
const openGroupPingModal = (topic) => {
  setSelectedTopic(topic);
  setGroupCustomMessage(`${topic} meeting is starting!`); // default message
  setGroupModalVisible(true);
};

// Function to send request to /send-group-ping with custom message entered to user
const sendGroupPing = async (topic, message) => {
  try {
     setIsPressed(true);
    await fetch(`${API_URL}/send-group-ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({sender_token: user.fcm_token,topic, message})
    });
    console.log('Sent group ping');
    setGroupModalVisible(false); //close modal
    Alert.alert('Success', `Group ping sent to ${topic}!`);
  } catch (error) {
    console.error('Error sending group ping:', error);
    Alert.alert('Error', 'Failed to send group ping. Please try again.');
  }finally{
    setIsPressed(false); 
  }
};

// Function to send request to /send-ping with custom message entered to user
const sendPing = async () => {
  if (!user?.id || !selectedRecipient) return;

  const message = customMessage.trim() || `Come for meeting`; //default alternate message if empty message

  try {
    setIsPressed(true); //disables button to prevent multiple clicks
    const response = await fetch(`${API_URL}/send-ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sender_id: user.id, 
        sender_token: user.fcm_token,
        recipient_id: selectedRecipient.id,
        message: message
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send ping');
    }

    const result = await response.json();

    //Pings format for being saved in localStorage
    const newPing = {
      id: Date.now(),
      notificationId: result.notification.id,
      recipientName: selectedRecipient.name,
      message: message,
      timestamp: new Date().toLocaleString(),
      status: 'sent'
    };

    // // DEBUG: Log before saving

    //update sent pings in local storage by adding the newly sent one
    const updatedPings = [newPing, ...sentPings];
    await saveSentPings(updatedPings);
    setSentPings(updatedPings);

    setModalVisible(false); //close modal
    console.log('Sent ping!')
    Alert.alert('Success', `Ping sent to ${selectedRecipient.name}!`);
  } catch (error) {
    console.error('Ping failed:', error);
    Alert.alert('Error', 'Failed to send ping. Please try again.');
  }finally {
    setIsPressed(false);
  }
};

//clear All button functionality
  const clearAllPings = async () => {
    try {
      await AsyncStorage.removeItem(SENT_PINGS_KEY);
      setSentPings([]);
    } catch (error) {
      console.error('Error clearing pings:', error);
    }
  };

  //function to set UI of sent notification/ping based on whether it has been read or not.(updates in real time)
  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <Text style={styles.singleTick}>✓</Text>;
      case 'read': return <Text style={styles.doubleTick}>✓✓</Text>;
      default: return null;
    }
  };
//precautionary safety check to set loading.. text in case user context missing, app wont crash.
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
      
      {/* Members List; Maps their data to a <View> element from supabase */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Pings</Text>
             <View style={styles.buttonContainer}>
  <View style={styles.buttonWrapper}>
    <Button title='All Software' onPress={() => openGroupPingModal('software')} />
  </View>
  <View style={styles.buttonWrapper}>
    <Button title='All Hardware' onPress={() => openGroupPingModal('hardware')} />
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
                onPress={() => openPingModal(member)} //modal opens to enter custom msg on pressing ping button
              />
            </View>
        )))}
      </View>
 
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


{/* Group Message Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={groupModalVisible}
  onRequestClose={() => setGroupModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>
        Send Group Ping to {selectedTopic}
      </Text>
      
      <TextInput
        style={styles.messageInput}
        placeholder="Enter your message"
        value={groupCustomMessage}
        onChangeText={setGroupCustomMessage}
        multiline
        maxLength={200}
      />
      
      <Text style={styles.charCount}>
        {groupCustomMessage.length}/200 characters
      </Text>
      
      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.cancelButton]} 
          onPress={() => setGroupModalVisible(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modalButton, styles.sendButton, isPressed && styles.disabledButton]} 
          onPress={() => sendGroupPing(selectedTopic, groupCustomMessage)}
          disabled={isPressed}
        >
          <Text style={styles.sendButtonText}>Send Group Ping</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
    </ScrollView>
  );
}

