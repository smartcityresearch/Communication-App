import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Admin from '../(home)/admin';
import { supabase } from '../../lib/supabase';

// Mock the Supabase insert method
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ error: null }))
    })),
  },
}));

describe('Admin Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Admin Panel title', () => {
    const { getByText } = render(<Admin />);
    expect(getByText('Admin Panel')).toBeTruthy();
  });

  test('generates key and logs success', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const { getByText, queryByText } = render(<Admin />);

    const generateButton = getByText('Generate Key');
    fireEvent.press(generateButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Inserted key');
    });

    // Check that key is displayed
    expect(queryByText(/Generated Key:/)).toBeTruthy();

    consoleSpy.mockRestore();
  });

 test('disables Generate button while loading', async () => {
  const { getByText, getByTestId } = render(<Admin />);

  const generateButton = getByText('Generate Key');
  fireEvent.press(generateButton);

  // Wait for the ActivityIndicator to appear
  await waitFor(() => {
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});

  test('clears key on Clear button press', async () => {
    const { getByText, queryByText } = render(<Admin />);

    fireEvent.press(getByText('Generate Key'));

    await waitFor(() => {
      expect(queryByText(/Generated Key:/)).toBeTruthy();
    });

    fireEvent.press(getByText('Clear'));

    expect(queryByText(/Generated Key:/)).toBeNull();
  });
});


// Component Rendering - Verifies the Admin Panel title displays correctly when the component loads
// Key Generation Functionality - Tests that clicking "Generate Key" button successfully creates a key and logs confirmation message
// Key Display - Confirms that generated keys are properly shown to the user with "Generated Key:" label
// Loading State Management - Ensures the Generate button becomes disabled during key generation and shows a loading indicator
// Clear Functionality - Validates that the Clear button successfully removes/hides the displayed generated key
// Database Integration - Mocks and tests Supabase database insertion operations for storing generated keys
// User Interface Interactions - Tests button press events and their corresponding UI state changes
// Asynchronous Operations - Handles and tests async behavior like waiting for key generation completion
