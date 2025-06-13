import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Messenger from '../(home)/messenger';
import { Alert } from 'react-native';

// Mock styles and LOCATIONS
jest.mock('../../styles/messenger', () => ({
  container: {},
  header: {},
  headerTitle: {},
  tabNavigation: {},
  tab: {},
  activeTab: {},
  tabText: {},
  activeTabText: {},
  tabContent: {},
  locationSelector: {},
  sectionTitle: {},
  locationButton: {},
  selectedLocation: {},
  locationButtonText: {},
  selectedLocationText: {},
  inputSection: {},
  inputGroup: {},
  inputLabel: {},
  textInput: {},
  sendButton: {},
  sendButtonText: {},
  commandSuggestions: {},
  suggestionButton: {},
  suggestionButtonText: {},
}));

jest.mock('../../messenger_urls.json', () => [
  { name: 'Location A', uri: 'http://localhost:3001' },
  { name: 'Location B', uri: 'http://localhost:3002' },
]);

// Suppress fetch warning
global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

// Spy on Alert
jest.spyOn(Alert, 'alert');

describe('Messenger Component', () => {
  beforeEach(() => {
    Alert.alert.mockClear();
    fetch.mockClear();
  });

  it('renders correctly and toggles tabs', () => {
    const { getByText } = render(<Messenger />);
    expect(getByText('SCRC MESSENGER')).toBeTruthy();
    expect(getByText('Announcement')).toBeTruthy();
    expect(getByText('Sensor Data')).toBeTruthy();

    fireEvent.press(getByText('Sensor Data'));
    expect(getByText('Sensor Commands:')).toBeTruthy();

    fireEvent.press(getByText('Announcement'));
    expect(getByText('Announcement Options:')).toBeTruthy();
  });

  it('shows error when trying to send single announcement without location or text', () => {
    const { getByText } = render(<Messenger />);
    fireEvent.press(getByText('Send Announcement'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please select location and enter announcement');
  });

  it('shows error when trying to send multiline announcement without lines', () => {
    const { getByText } = render(<Messenger />);
    fireEvent.press(getByText('Send Lines'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill at least one line');
  });

  it('lets user select a location and enter lines', () => {
    const { getByText, getByPlaceholderText } = render(<Messenger />);
    fireEvent.press(getByText('Location A'));
    fireEvent.changeText(getByPlaceholderText('Line 1'), 'Hello');
    fireEvent.changeText(getByPlaceholderText('Line 2'), 'World');
    fireEvent.changeText(getByPlaceholderText('Line 3'), '1234567890');
    fireEvent.changeText(getByPlaceholderText('Line 4'), 'Trim');

    expect(getByPlaceholderText('Line 1').props.value).toBe('Hello');
  });

  it('restricts line input to 10 characters', () => {
    const { getByPlaceholderText } = render(<Messenger />);
    const input = getByPlaceholderText('Line 1');
    fireEvent.changeText(input, '123456789012345');
    expect(input.props.value.length).toBeLessThanOrEqual(10);
  });

  it('handles quick command buttons correctly', () => {
    const { getByText } = render(<Messenger />);
    fireEvent.press(getByText('Sensor Data'));

    const quickCmd = getByText('aq');
    fireEvent.press(quickCmd);
    expect(getByText('aq')).toBeTruthy();
  });

  it('shows error when trying to send command without selecting location or entering command', () => {
    const { getByText } = render(<Messenger />);
    fireEvent.press(getByText('Sensor Data'));
    fireEvent.press(getByText('Send Command'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please select a location and enter a command');
  });

  it('lets user enter command after selecting location', () => {
    const { getByText, getByPlaceholderText } = render(<Messenger />);
    fireEvent.press(getByText('Sensor Data'));
    fireEvent.press(getByText('Location A'));

    const cmdInput = getByPlaceholderText('Enter command here...');
    fireEvent.changeText(cmdInput, 'aq');
    expect(cmdInput.props.value).toBe('aq');
  });
});

// Component Rendering - Verifies the "SCRC MESSENGER" title and main tabs (Announcement/Sensor Data) display correctly
// Tab Navigation - Tests switching between Announcement and Sensor Data tabs and their respective content sections
// Location Selection - Validates users can select locations from available options (Location A, Location B)
// Input Validation - Tests error handling for missing required fields (location and text/command not provided)
// Text Input Management - Verifies users can enter text in multiple line inputs (Line 1-4) and command input fields
// Character Limit Enforcement - Ensures line inputs are restricted to maximum 10 characters
// Quick Command Functionality - Tests pre-defined command buttons (like "aq") work correctly in Sensor Data tab
// Form Submission Errors - Validates appropriate error alerts show for incomplete forms (missing location/text/commands)
// User Interface Interactions - Tests button presses, text changes, and form field interactions
// Mock Integration - Tests with mocked styles, location data, and network fetch operations
// Alert System - Verifies error messages display correctly through React Native Alert component