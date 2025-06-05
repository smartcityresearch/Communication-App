// server.js - Simplified version
const express = require('express');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Firebase
const serviceAccount = require('./test2-537f3-firebase-adminsdk-fbsvc-02eec8b1f1.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const supabaseUrl = 'https://qorzcargbhgjgbvdioym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcnpjYXJnYmhnamdidmRpb3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDI4MDAsImV4cCI6MjA2Mjc3ODgwMH0.xOH74HMTRm4rS42lMlnZ2jCTDSC1ZnAkL5DB-CfclQ0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// server.js - Fixed version
app.post('/send-ping', async (req, res) => {
  try {
    const { sender_id, recipient_id, message = 'Ping!' } = req.body;
    
    // Input validation
    if (!sender_id || !recipient_id) {
      return res.status(400).json({ error: 'Missing sender or recipient ID' });
    }

    // Get recipient info
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('fcm_token, name')
      .eq('id', recipient_id)
      .single();

    if (recipientError || !recipient) {
      console.error('Recipient error:', recipientError);
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Get sender info
    const { data: sender, error: senderError } = await supabase
      .from('users')
      .select('name')
      .eq('id', sender_id)
      .single();

    if (senderError || !sender) {
      console.error('Sender error:', senderError);
      return res.status(404).json({ error: 'Sender not found' });
    }

    // Insert notification
    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        sender_id: sender_id,
        recipient_id: recipient_id,
        message: message,
        status: 'sent'
      })
      .select()
      .single();

    if (insertError || !notification) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ 
        error: 'Failed to create notification',
        details: insertError 
      });
    }

    // Send push notification - FIXED PAYLOAD
    const messagePayload = {
      token: recipient.fcm_token,
      notification: { 
        title: 'New Ping!', 
        body: `${sender?.name || 'Someone'}: ${message}`
      },
      data: { 
        notification_id: notification.id.toString(),
        sender_id: sender_id.toString(),
        message: message,
        type: 'ping'
      },
      android: {
        notification: {
          channelId: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            category: 'PING_CATEGORY' // For iOS actions
          }
        }
      }
    };

    await admin.messaging().send(messagePayload);

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error sending ping:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/mark-read', async (req, res) => {
  try {
    const { notification_id } = req.body;
    
    console.log('Marking notification as read:', notification_id);

    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notification_id)
      .single();

    if (fetchError) {
      console.error('Error fetching notification:', fetchError);
      return res.status(404).json({ error: 'Notification not found' });
    }

    console.log('Notification before update:', notification);

    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('id', notification_id);

    if (error) {
      console.error('Error updating notification:', error);
      return res.status(500).json({ error: 'Failed to mark as read' });
    }

    console.log('Successfully marked as read');
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/send-group-ping', async (req, res) => {
  const { topic } = req.body;
  try {
    await admin.messaging().send({
      topic,
      notification: {
        title: 'Group Ping',
        body: `${topic} meeting is starting!`,
      }
    });

    res.status(200).json({ success: true, message: 'Group ping sent' });
  } catch (error) {
    console.error('FCM error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/verify-admin-key', (req, res) => {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ success: false, error: 'Key is required' });
  }
  if (key === process.env.ADMIN_SECRET_KEY) {
    return res.status(200).json({ success: true });
  }
  return res.status(401).json({ success: false, error: 'Invalid key' });
});

setInterval(async () => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // older than 10 mins

    if (error) {
      console.error('Error deleting old notifications:', error);
    } else {
      console.log('Old notifications deleted successfully');
    }
  } catch (err) {
    console.error('Interval error:', err);
  }
}, 10 * 60 * 1000); // every 10 minutes

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});