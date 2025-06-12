import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, SafeAreaView } from 'react-native';
import styles from '../../styles/messenger';
// Hard-coded IPs for display boards
import LOCATIONS from '../../messenger_urls.json';

const COMMAND_SUGGESTIONS = ['aq', 'srEM', 'wd', 'wf', 'wn'];

const Messenger = () => {
  const [activeTab, setActiveTab] = useState('announcement');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [lines, setLines] = useState(['', '', '', '']);
  const [command, setCommand] = useState('');

  const getLocationURI = () => LOCATIONS.find(loc => loc.name === selectedLocation)?.uri;

  const handleRequest = async (data, type) => {
    const uri = getLocationURI();
    if (!uri) return Alert.alert('Error', 'Please select a valid location');

    try {
      const response = await fetch(uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, type }),
      });

      if (response.ok) {
        Alert.alert('Success', `${type} sent successfully!`);
        clearInputs(type);
      } else {
        Alert.alert('Error', `Failed to send ${type.toLowerCase()}`);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const clearInputs = (type) => {
    if (type === 'TXT') {
      setAnnouncementText('');
      setLines(['', '', '', '']);
    } else if (type === 'CMD') {
      setCommand('');
    }
  };

  const renderLocationSelector = () => (
    <View style={styles.locationSelector}>
      <Text style={styles.sectionTitle}>Select Location:</Text>
      {LOCATIONS.map(({ name }) => (
        <TouchableOpacity
          key={name}
          style={[
            styles.locationButton,
            selectedLocation === name && styles.selectedLocation
          ]}
          onPress={() => setSelectedLocation(name)}
        >
          <Text
            style={[
              styles.locationButtonText,
              selectedLocation === name && styles.selectedLocationText
            ]}
          >
            {name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const LineInput = ({ index }) => (
    <TextInput
      style={styles.textInput}
      placeholder={`Line ${index + 1}`}
      placeholderTextColor="#888"
      value={lines[index]}
      onChangeText={text => {
        if (text.length <= 10) {
          const updated = [...lines];
          updated[index] = text;
          setLines(updated);
        }
      }}
      maxLength={10}
    />
  );

  const renderAnnouncementTab = () => (
    <ScrollView style={styles.tabContent}>
      {renderLocationSelector()}

      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Announcement Options:</Text>

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
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => {
              if (!selectedLocation || !announcementText)
                return Alert.alert('Error', 'Please select location and enter announcement');
              handleRequest({ data: announcementText }, 'TXT');
            }}
          >
            <Text style={styles.sendButtonText}>Send Announcement</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Multiple Lines (Max 10 chars each):</Text>
          {[0, 1, 2, 3].map(i => <LineInput key={i} index={i} />)}

          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => {
              if (!selectedLocation || lines.every(line => line.trim() === ''))
                return Alert.alert('Error', 'Please fill at least one line');
              const payload = {};
              lines.forEach((line, i) => {
                if (line.trim()) payload[['one', 'two', 'three', 'four'][i]] = line;
              });
              handleRequest(payload, 'TXT');
            }}
          >
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
            {COMMAND_SUGGESTIONS.map(cmd => (
              <TouchableOpacity
                key={cmd}
                style={styles.suggestionButton}
                onPress={() => setCommand(cmd)}
              >
                <Text style={styles.suggestionButtonText}>{cmd}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => {
              if (!selectedLocation || !command.trim())
                return Alert.alert('Error', 'Please select a location and enter a command');
              handleRequest({ data: command.trim() }, 'CMD');
            }}
          >
            <Text style={styles.sendButtonText}>Send Command</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SCRC MESSENGER</Text>
      </View>

      <View style={styles.tabNavigation}>
        {['announcement', 'sensorData'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'announcement' ? 'Announcement' : 'Sensor Data'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'announcement' ? renderAnnouncementTab() : renderSensorDataTab()}
    </SafeAreaView>
  );
};

export default Messenger;
