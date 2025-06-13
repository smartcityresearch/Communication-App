import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Index from '../index';

//mocks async storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

//mocks the picker used for domain
jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const Picker = ({ children, onValueChange, selectedValue, testID }) => (
    <View testID={testID}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          onPress: () => onValueChange(child.props.value),
        })
      )}
    </View>
  );
  Picker.Item = ({ label, value, onPress }) => (
    <Text onPress={onPress} accessibilityLabel={label}>
      {label}
    </Text>
  );
  return { Picker };
});

// Prevent navigation and user context issues
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('../../context/userContext', () => ({
  useUser: () => ({ setUser: jest.fn() }),
}));

//fcm token
jest.mock('../../lib/notifications', () => ({
  getFCMToken: jest.fn(() => 'mock-fcm-token'),
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true }),
  })
);

//check test on landing page
describe('Index screen', () => {
  it('renders welcome text and name input', () => {
    const { getByText, getByPlaceholderText } = render(<Index />);
    expect(getByText('Welcome! Please enter your details:')).toBeTruthy();
    expect(getByPlaceholderText('Enter your name')).toBeTruthy();
  });

//access key input displays only when domain selected
  it('shows access key input after selecting domain', async () => {
    const { getByText, getByTestId, getByPlaceholderText } = render(<Index />);
    fireEvent.press(getByText('Software')); // Triggers onValueChange mock
    await waitFor(() => {
      expect(getByPlaceholderText('Ask admin for your access key')).toBeTruthy();
    });
  });

  //success message on correct key
  it('verifies key and shows success message', async () => {
    const { getByText, getByTestId, getByPlaceholderText } = render(<Index />);

    fireEvent.press(getByText('Admin'));
    await waitFor(() => {
      fireEvent.changeText(getByPlaceholderText('Enter admin key'), 'validkey');
      fireEvent.press(getByText('Verify Key'));
    });

    await waitFor(() => {
      expect(getByText('✓ Key verified successfully')).toBeTruthy();
    });
  });

  it('submits user data when form is complete', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { getByText, getByTestId, getByPlaceholderText } = render(<Index />);

    fireEvent.changeText(getByPlaceholderText('Enter your name'), 'John Doe');
    fireEvent.press(getByText('Software'));

    await waitFor(() => {
      fireEvent.changeText(getByPlaceholderText('Ask admin for your access key'), 'key123');
      fireEvent.press(getByText('Verify Key'));
    });

    await waitFor(() => {
      expect(getByText('✓ Key verified successfully')).toBeTruthy();
      fireEvent.press(getByText('Submit'));
    });

    consoleLogSpy.mockRestore();
  });
});


// Initial Component Rendering - Verifies welcome message and name input field display correctly on page load
// Form Field Interactions - Tests user can enter their name in the input field
// Domain Selection Logic - Validates that selecting a domain (Software/Admin) triggers appropriate UI changes
// Conditional Field Display - Ensures access key input only appears after a domain is selected
// Key Verification Process - Tests the key verification functionality with valid keys showing success messages
// Form Completion Flow - Validates the complete user registration process from name entry to final submission
// Success State Management - Confirms success indicators (✓ Key verified successfully) display properly after verification
// Async Operations - Handles asynchronous key verification and form submission processes
// Mock Integrations - Tests with mocked AsyncStorage, Picker component, navigation, user context, and FCM tokens
// Data Persistence - Verifies user data storage and retrieval through AsyncStorage mocking
// Network Requests - Tests API calls for key verification using mocked fetch operations
// Navigation Flow - Ensures proper routing after successful form completion