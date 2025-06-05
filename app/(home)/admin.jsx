import { useState } from 'react';
import {View,Text,TextInput, TouchableOpacity,Alert, ScrollView, SafeAreaView} from 'react-native';
import styles from '../../styles/admin';

const admin = () => {
  const [activeTab, setActiveTab] = useState('announcement');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [line3, setLine3] = useState('');
  const [line4, setLine4] = useState('');
  const [command, setCommand] = useState('');

  const locations = [
    { name: 'SCRC LAB 1', uri: 'http://10.2.201.167:8100/update' },
    { name: 'HARDWARE LAB', uri: 'http://10.2.201.164:6001' },
    { name: 'DISPLAY BOARD', uri: 'http://10.2.201.147:8100/update' },
    { name: 'SOFTWARE LAB', uri: 'http://10.2.201.145:8100' },
  ];

  const commandSuggestions = ['aq', 'srEM', 'wd', 'wf', 'wn'];

  const sendAnnouncementData = async () => {
    if (!selectedLocation || !announcementText) {
      Alert.alert('Error', 'Please select a location and enter announcement text');
      return;
    }

    const location = locations.find(loc => loc.name === selectedLocation);
    const jsonData = {
      data: announcementText,
      type: 'TXT'
    };

    try {
      const response = await fetch(location.uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      if (response.ok) {
        Alert.alert('Success', 'Announcement sent successfully!');
        setAnnouncementText('');
      } else {
        Alert.alert('Error', 'Failed to send announcement');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
      console.error('Error:', error);
    }
  };

  const sendLinesData = async () => {
    if (!selectedLocation || (!line1 && !line2 && !line3 && !line4)) {
      Alert.alert('Error', 'Please select a location and enter at least one line');
      return;
    }

    const location = locations.find(loc => loc.name === selectedLocation);
    const jsonData = {
      type: 'TXT'
    };

    if (line1) jsonData.one = line1;
    if (line2) jsonData.two = line2;
    if (line3) jsonData.three = line3;
    if (line4) jsonData.four = line4;

    try {
      const response = await fetch(location.uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      if (response.ok) {
        Alert.alert('Success', 'Lines sent successfully!');
        setLine1('');
        setLine2('');
        setLine3('');
        setLine4('');
      } else {
        Alert.alert('Error', 'Failed to send lines');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
      console.error('Error:', error);
    }
  };

  const sendCommandData = async () => {
    if (!selectedLocation || !command) {
      Alert.alert('Error', 'Please select a location and enter a command');
      return;
    }

    const location = locations.find(loc => loc.name === selectedLocation);
    const jsonData = {
      data: command,
      type: 'CMD'
    };

    try {
      const response = await fetch(location.uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      if (response.ok) {
        Alert.alert('Success', 'Command sent successfully!');
        setCommand('');
      } else {
        Alert.alert('Error', 'Failed to send command');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
      console.error('Error:', error);
    }
  };

  const renderLocationSelector = () => (
    <View style={styles.locationSelector}>
      <Text style={styles.sectionTitle}>Select Location:</Text>
      {locations.map((location) => (
        <TouchableOpacity
          key={location.name}
          style={[
            styles.locationButton,
            selectedLocation === location.name && styles.selectedLocation
          ]}
          onPress={() => setSelectedLocation(location.name)}
        >
          <Text style={[
            styles.locationButtonText,
            selectedLocation === location.name && styles.selectedLocationText
          ]}>
            {location.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAnnouncementTab = () => (
    <ScrollView style={styles.tabContent}>
      {renderLocationSelector()}
      
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Announcement Options:</Text>
        
        {/* Single Announcement */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Single Announcement:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Type your announcement here..."
            placeholderTextColor="#888"
            value={announcementText}
            onChangeText={setAnnouncementText}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendAnnouncementData}>
            <Text style={styles.sendButtonText}>Send Announcement</Text>
          </TouchableOpacity>
        </View>

        {/* Multiple Lines (for Hardware Lab) */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Multiple Lines (Max 10 chars each):</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Line 1"
            placeholderTextColor="#888"
            value={line1}
            onChangeText={(text) => text.length <= 10 && setLine1(text)}
            maxLength={10}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Line 2"
            placeholderTextColor="#888"
            value={line2}
            onChangeText={(text) => text.length <= 10 && setLine2(text)}
            maxLength={10}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Line 3"
            placeholderTextColor="#888"
            value={line3}
            onChangeText={(text) => text.length <= 10 && setLine3(text)}
            maxLength={10}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Line 4"
            placeholderTextColor="#888"
            value={line4}
            onChangeText={(text) => text.length <= 10 && setLine4(text)}
            maxLength={10}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendLinesData}>
            <Text style={styles.sendButtonText}>Send Lines</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderSensorDataTab = () => (
    <ScrollView style={styles.tabContent}>
      {renderLocationSelector()}
      
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Sensor Commands:</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Enter Command:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter command here..."
            placeholderTextColor="#888"
            value={command}
            onChangeText={setCommand}
          />
          
          <Text style={styles.inputLabel}>Quick Commands:</Text>
          <View style={styles.commandSuggestions}>
            {commandSuggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionButton}
                onPress={() => setCommand(suggestion)}
              >
                <Text style={styles.suggestionButtonText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.sendButton} onPress={sendCommandData}>
            <Text style={styles.sendButtonText}>Send Command</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SCRC MESSENGER</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'announcement' && styles.activeTab]}
          onPress={() => setActiveTab('announcement')}
        >
          <Text style={[styles.tabText, activeTab === 'announcement' && styles.activeTabText]}>
            Announcement
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sensorData' && styles.activeTab]}
          onPress={() => setActiveTab('sensorData')}
        >
          <Text style={[styles.tabText, activeTab === 'sensorData' && styles.activeTabText]}>
            Sensor Data
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'announcement' ? renderAnnouncementTab() : renderSensorDataTab()}
    </SafeAreaView>
  );
};


export default admin;