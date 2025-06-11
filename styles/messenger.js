import { StyleSheet } from 'react-native';
//Styles for (home)/messenger
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#000',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#111',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#333',
  },
  activeTab: {
    backgroundColor: '#00bcd4',
  },
  tabText: {
    color: '#fff',
    fontSize: 16,
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  locationSelector: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#00bcd4',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  locationButton: {
    backgroundColor: '#333',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedLocation: {
    backgroundColor: '#00bcd4',
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedLocationText: {
    fontWeight: 'bold',
  },
  inputSection: {
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#111',
    borderRadius: 8,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    minHeight: 50,
  },
  commandSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  suggestionButton: {
    backgroundColor: '#555',
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  suggestionButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#00bcd4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default styles;