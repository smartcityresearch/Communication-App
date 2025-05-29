//server.js
const express = require('express');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const bodyParser = require('body-parser');
const cors = require('cors');

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


// Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API Endpoints
app.post('/send-ping', async (req, res) => {
  try {
    const { sender_id, recipient_id } = req.body;
    
    // Get recipient's FCM token
    const { data: recipient } = await supabase
      .from('users')
      .select('fcm_token, domain')
      .eq('id', recipient_id)
      .single();

    if (!recipient?.fcm_token) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

     // Get sender info for notification display
    const { data: sender } = await supabase
      .from('users')
      .select('name')
      .eq('name', sender_id)
      .single();

    // Store notification in database
    const { data: notification } = await supabase
      .from('notifications')
      .insert({
        sender_id,
        recipient_id,
        fcm_token: recipient.fcm_token,
        status: 'sent'
      })
      .select()
      .single();

    // Send push notification
    await admin.messaging().send({
      token: recipient.fcm_token,
      notification: { 
        title: 'New Ping!', 
        body: `From ${sender?.name || 'Someone'}`
      },
      data: { 
        notification_id: notification.id.toString(),
        sender_id: sender_id.toString(),
        type: 'ping'
      },
      android: {
        notification: {
          channelId: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      }
    });

    res.json(notification);
  } catch (error) {
    console.error('Error sending ping:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/mark-read', async (req, res) => {
  try {
    const { notification_id } = req.body;
    
    // Update notification status
    await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('id', notification_id);

    // Get original notification
    const { data: original } = await supabase
      .from('notifications')
      .select()
      .eq('id', notification_id)
      .single();

    if (original) {
      // Create read receipt
      await supabase
        .from('notifications')
        .insert({
          sender_id: original.recipient_id,
          recipient_id: original.sender_id,
          status: 'read_ack'
        });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});