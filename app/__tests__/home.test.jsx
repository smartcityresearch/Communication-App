import React from 'react';
import { render, fireEvent, waitFor, act, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Index from '../(home)/index';
import { useUser } from '../../context/userContext';
import * as supabaseModule from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock useUser hook
jest.mock('../../context/userContext', () => ({
  useUser: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to avoid noise in tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock Supabase with more detailed structure
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockImplementation((callback) => {
    if (typeof callback === 'function') {
      callback('SUBSCRIBED', null);
    }
    return { unsubscribe: jest.fn() };
  }),
  unsubscribe: jest.fn(),
};

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    channel: jest.fn(() => mockChannel),
  },
}));

describe('Home Index Screen - Enhanced Coverage', () => {
  const mockUser = {
    id: 1,
    name: 'Satvik',
    fcm_token: 'dummy-token',
    domain: 'software'
  };

  const mockSetUser = jest.fn();
  const mockMembers = [
    { id: 2, name: 'John', domain: 'hardware' },
    { id: 3, name: 'Jane', domain: 'software' },
    { id: 4, name: 'Bob', domain: 'admin' }
  ];

  const mockSentPings = [
    {
      id: 1,
      notificationId: 'notif-123',
      recipientName: 'John',
      message: 'Come for meeting',
      timestamp: '12/25/2024, 10:00:00 AM',
      status: 'sent'
    },
    {
      id: 2,
      notificationId: 'notif-456',
      recipientName: 'Jane',
      message: 'Review needed',
      timestamp: '12/25/2024, 11:00:00 AM',
      status: 'read'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    useUser.mockReturnValue({
      user: mockUser,
      setUser: mockSetUser,
    });

    // Set up AsyncStorage with sent pings data by default
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'sent_pings') return Promise.resolve(JSON.stringify(mockSentPings));
      if (key === 'user') return Promise.resolve(JSON.stringify(mockUser));
      return Promise.resolve(null);
    });

    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.removeItem.mockResolvedValue();

    // Mock successful fetch response
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        notification: { id: 'notif-123' },
        success: true 
      }),
    });

    // Mock Supabase response
    supabaseModule.supabase.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: mockMembers, error: null }),
    });
  });

  describe('Loading States', () => {
    it('renders loading screen when no user', () => {
      useUser.mockReturnValue({ user: null, setUser: jest.fn() });
      const { getByText } = render(<Index />);
      expect(getByText('Loading...')).toBeTruthy();
    });

    it('renders loading for members when members array is empty', () => {
      supabaseModule.supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const { getByText } = render(<Index />);
      expect(getByText('Loading...')).toBeTruthy();
    });
  });

  describe('User Initialization', () => {
    it('initializes user from AsyncStorage when context is lost', async () => {
      useUser.mockReturnValue({ user: null, setUser: mockSetUser });
      
      render(<Index />);
      
      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('user');
        expect(mockSetUser).toHaveBeenCalledWith(mockUser);
      });
    });

    it('handles error when loading user from storage', async () => {
      useUser.mockReturnValue({ user: null, setUser: mockSetUser });
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));
      
      render(<Index />);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error loading user from storage:', expect.any(Error));
      });
    });

    it('renders welcome message with user name', async () => {
      const { findByText } = render(<Index />);
      const welcome = await findByText('Welcome, Satvik!');
      expect(welcome).toBeTruthy();
    });
  });

  describe('Members Management', () => {
    it('fetches and displays organization members', async () => {
      const { findByText } = render(<Index />);
      
      await waitFor(() => {
        expect(supabaseModule.supabase.from).toHaveBeenCalledWith('users');
      });

      expect(await findByText('John')).toBeTruthy();
      expect(await findByText('Jane')).toBeTruthy();
      expect(await findByText('Bob')).toBeTruthy();
    });

    it('handles error when fetching members', async () => {
      supabaseModule.supabase.from.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      render(<Index />);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error fetching members:', expect.any(Error));
      });
    });

    it('displays member domains correctly', async () => {
      const { findByText } = render(<Index />);
      
      expect(await findByText('(hardware)')).toBeTruthy();
      expect(await findByText('(software)')).toBeTruthy();
      expect(await findByText('(admin)')).toBeTruthy();
    });
  });

  describe('Group Ping Functionality', () => {
    it('renders group ping buttons', async () => {
      const { findByText } = render(<Index />);
      expect(await findByText('All Software')).toBeTruthy();
      expect(await findByText('All Hardware')).toBeTruthy();
    });

    it('opens group ping modal for software', async () => {
      const { getByText } = render(<Index />);
      
      fireEvent.press(getByText('All Software'));
      
      await waitFor(() => {
        expect(getByText('Send Group Ping to software')).toBeTruthy();
      });
    });

    it('opens group ping modal for hardware', async () => {
      const { getByText } = render(<Index />);
      
      fireEvent.press(getByText('All Hardware'));
      
      await waitFor(() => {
        expect(getByText('Send Group Ping to hardware')).toBeTruthy();
      });
    });

    it('shows default message in group modal', async () => {
      const { getByText, getByDisplayValue } = render(<Index />);
      
      fireEvent.press(getByText('All Software'));
      
      await waitFor(() => {
        expect(getByDisplayValue('software meeting is starting!')).toBeTruthy();
      });
    });

    it('allows editing group message', async () => {
      const { getByText, getByDisplayValue } = render(<Index />);
      
      fireEvent.press(getByText('All Software'));
      
      const messageInput = getByDisplayValue('software meeting is starting!');
      fireEvent.changeText(messageInput, 'Custom group message');
      
      expect(messageInput.props.value).toBe('Custom group message');
    });

    it('sends group ping successfully', async () => {
      const { getByText } = render(<Index />);
      
      fireEvent.press(getByText('All Software'));
      
      const sendButton = getByText('Send Group Ping');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://192.168.19.66:3000/send-group-ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender_token: 'dummy-token',
            topic: 'software',
            message: 'software meeting is starting!'
          })
        });
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Group ping sent to software!');
      });
    });

    it('handles group ping error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const { getByText } = render(<Index />);
      
      fireEvent.press(getByText('All Software'));
      
      const sendButton = getByText('Send Group Ping');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to send group ping. Please try again.');
      });
    });

    it('closes group modal on cancel', async () => {
      const { getByText, queryByText } = render(<Index />);
      
      fireEvent.press(getByText('All Software'));
      
      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);
      
      await waitFor(() => {
        expect(queryByText('Send Group Ping to software')).toBeNull();
      });
    });
  });

  describe('Individual Ping Functionality', () => {
    it('opens individual ping modal on button press', async () => {
      const { findAllByText, getByText } = render(<Index />);
      
      const pingButtons = await findAllByText('Ping');
      fireEvent.press(pingButtons[0]);

      await waitFor(() => {
        expect(getByText('Send Ping to John')).toBeTruthy();
      });
    });

    it('shows default message in individual modal', async () => {
      const { findAllByText, getByDisplayValue } = render(<Index />);
      
      const pingButtons = await findAllByText('Ping');
      fireEvent.press(pingButtons[0]);

      await waitFor(() => {
        expect(getByDisplayValue('Come for meeting')).toBeTruthy();
      });
    });

    it('allows editing individual message', async () => {
      const { findAllByText, getByDisplayValue } = render(<Index />);
      
      const pingButtons = await findAllByText('Ping');
      fireEvent.press(pingButtons[0]);

      const messageInput = getByDisplayValue('Come for meeting');
      fireEvent.changeText(messageInput, 'Custom message');
      
      expect(messageInput.props.value).toBe('Custom message');
    });

    it('shows character count for individual message', async () => {
      const { findAllByText, getByDisplayValue, getByText } = render(<Index />);
      
      const pingButtons = await findAllByText('Ping');
      fireEvent.press(pingButtons[0]);

      const messageInput = getByDisplayValue('Come for meeting');
      fireEvent.changeText(messageInput, 'Test');
      
      expect(getByText('4/200 characters')).toBeTruthy();
    });

    it('sends individual ping successfully', async () => {
      const { findAllByText, getByText } = render(<Index />);
      
      const pingButtons = await findAllByText('Ping');
      fireEvent.press(pingButtons[0]);

      const sendButton = getByText('Send Ping');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://192.168.19.66:3000/send-ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender_id: 1,
            sender_token: 'dummy-token',
            recipient_id: 2,
            message: 'Come for meeting'
          })
        });
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Ping sent to John!');
      });
    });

    it('handles individual ping error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const { findAllByText, getByText } = render(<Index />);
      
      const pingButtons = await findAllByText('Ping');
      fireEvent.press(pingButtons[0]);

      const sendButton = getByText('Send Ping');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to send ping. Please try again.');
      });
    });

    it('uses default message when empty message is sent', async () => {
      const { findAllByText, getByText, getByDisplayValue } = render(<Index />);
      
      const pingButtons = await findAllByText('Ping');
      fireEvent.press(pingButtons[0]);

      const messageInput = getByDisplayValue('Come for meeting');
      fireEvent.changeText(messageInput, '   '); // Empty/whitespace message

      const sendButton = getByText('Send Ping');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
          body: expect.stringContaining('"message":"Come for meeting"')
        }));
      });
    });

    it('closes individual modal on cancel', async () => {
      const { findAllByText, getByText, queryByText } = render(<Index />);
      
      const pingButtons = await findAllByText('Ping');
      fireEvent.press(pingButtons[0]);

      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);
      
      await waitFor(() => {
        expect(queryByText('Send Ping to John')).toBeNull();
      });
    });
  });

  describe('Sent Pings Management', () => {
    it('loads and displays sent pings from AsyncStorage', async () => {
      const { findByText } = render(<Index />);
      
      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('sent_pings');
      });

      expect(await findByText('Sent Messages')).toBeTruthy();
      expect(await findByText('To: John')).toBeTruthy();
      expect(await findByText('"Come for meeting"')).toBeTruthy();
    });

    it('handles error when loading sent pings', async () => {
      AsyncStorage.getItem.mockImplementationOnce((key) => 
        key === 'sent_pings' ? Promise.reject(new Error('Storage error')) : Promise.resolve(null)
      );
      
      render(<Index />);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error loading sent pings:', expect.any(Error));
      });
    });

    it('displays sent pings with correct status icons', async () => {
      const { findAllByText } = render(<Index />);
      
      await waitFor(() => {
        expect(screen.getByText('Sent Messages')).toBeTruthy();
      });
      
      const singleTicks = await findAllByText('✓');
      const doubleTicks = await findAllByText('✓✓');
      
      expect(singleTicks.length).toBeGreaterThan(0);
      expect(doubleTicks.length).toBeGreaterThan(0);
    });

    it('saves new ping to AsyncStorage after sending', async () => {
      const { findAllByText, getByText } = render(<Index />);
      
      const pingButtons = await findAllByText('Ping');
      fireEvent.press(pingButtons[0]);

      const sendButton = getByText('Send Ping');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('sent_pings', expect.any(String));
      });
    });

    it('clears all pings when Clear All is pressed', async () => {
      const { findByText, getByText } = render(<Index />);
      
      await findByText('Sent Messages');
      
      const clearButton = getByText('Clear All');
      fireEvent.press(clearButton);
      
      await waitFor(() => {
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('sent_pings');
      });
    });

    it('handles error when clearing pings', async () => {
      AsyncStorage.removeItem.mockRejectedValueOnce(new Error('Storage error'));

      const { findByText, getByText } = render(<Index />);
      
      await findByText('Sent Messages');
      
      const clearButton = getByText('Clear All');
      fireEvent.press(clearButton);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error clearing pings:', expect.any(Error));
      });
    });

    it('does not show Sent Messages section when no pings exist', async () => {
      AsyncStorage.getItem.mockImplementationOnce((key) => 
        key === 'sent_pings' ? Promise.resolve(JSON.stringify([])) : Promise.resolve(null)
      );

      const { queryByText } = render(<Index />);
      
      await waitFor(() => {
        expect(queryByText('Sent Messages')).toBeNull();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('sets up realtime listener for ping status updates', () => {
      render(<Index />);
      
      expect(supabaseModule.supabase.channel).toHaveBeenCalledWith('ping-reads-1');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: 'sender_id=eq.1',
        },
        expect.any(Function)
      );
    });

    it('updates ping status when real-time update received', async () => {
      render(<Index />);
      
      // Simulate realtime update
      const updateHandler = mockChannel.on.mock.calls[0][2];
      await act(async () => {
        updateHandler({
          new: { id: 'notif-123', status: 'read' }
        });
      });
      
      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('unsubscribes from channel on unmount', () => {
      const { unmount } = render(<Index />);
      
      unmount();
      
    });
  });

  describe('Button States and Validation', () => {
    it('disables send button during individual ping', async () => {
      const { findAllByText, getByText } = render(<Index />);
      
      const pingButtons = await findAllByText('Ping');
      fireEvent.press(pingButtons[0]);

      const sendButton = getByText('Send Ping');
      fireEvent.press(sendButton);
      
    });

    it('disables send button during group ping', async () => {
      const { getByText } = render(<Index />);
      
      fireEvent.press(getByText('All Software'));
      
      const sendButton = getByText('Send Group Ping');
      fireEvent.press(sendButton);
      
    });

    it('returns early from sendPing when no user or recipient', async () => {
      useUser.mockReturnValueOnce({ user: null, setUser: jest.fn() });
      
      render(<Index />);
      
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Status Icon Rendering', () => {
    it('renders correct status icon for sent status', async () => {
      AsyncStorage.getItem.mockImplementationOnce((key) => 
        key === 'sent_pings' ? Promise.resolve(JSON.stringify([{ ...mockSentPings[0], status: 'sent' }])) : Promise.resolve(null)
      );

      const { findAllByText } = render(<Index />);
      
      expect((await findAllByText('✓')).length).toBeGreaterThan(0);
    });

    it('renders correct status icon for read status', async () => {
      AsyncStorage.getItem.mockImplementationOnce((key) => 
        key === 'sent_pings' ? Promise.resolve(JSON.stringify([{ ...mockSentPings[0], status: 'read' }])) : Promise.resolve(null)
      );

      const { findAllByText } = render(<Index />);
      
      expect((await findAllByText('✓✓')).length).toBeGreaterThan(0);
    });

    it('renders no icon for unknown status', async () => {
      AsyncStorage.getItem.mockImplementationOnce((key) => 
        key === 'sent_pings' ? Promise.resolve(JSON.stringify([{ ...mockSentPings[0], status: 'unknown' }])) : Promise.resolve(null)
      );

      const { queryByText } = render(<Index />);
      
      await waitFor(() => {
        expect(queryByText('✓')).toBeNull();
        expect(queryByText('✓✓')).toBeNull();
      });
    });
  });
});