// server.js - Simplified version
const express = require('express');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();
const axios=require('axios');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.json());

// Initialize Firebase
const serviceAccount = require('./test2-537f3-firebase-adminsdk-fbsvc-02eec8b1f1.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

//HAHAPOINT
const displayBoardURL={
  'software':['http://192.168.19.234/display?msg=', 'http://192.168.19.117/display?msg=', 'http://192.168.19.30/display?msg='],
  'hardware': ['http://192.168.19.122/display?msg='],
  'admin': ['http://192.168.19.234/display?msg=']
}


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
      .select('fcm_token, name,domain')
      .eq('id', recipient_id)
      .single();

    if (recipientError || !recipient) {
      console.error('Recipient error:', recipientError);
      return res.status(404).json({ error: 'Recipient not found' });
    }else{
      console.log(recipient);
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
    //HAHAPOINT
    for (const url of displayBoardURL[recipient?.domain] || []) {
  await axios.get(`${url}${sender?.name}%20sent%20msg%20to%20${recipient?.name}`);
}
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
    //HAHAPOINT
     for (const url of displayBoardURL[topic] || []) {
  await axios.get(`${url}${topic}%20meeting%20is%20starting!`);
}
    // await axios.get(`${displayBoardURL}${topic}%20meeting%20is%20starting!`);
    res.status(200).json({ success: true, message: 'Group ping sent' });
  } catch (error) {
    console.error('FCM error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/verify-key', async (req, res) => {
  const { key, domain } = req.body;
  
  if (!key || !domain) {
    return res.status(400).json({ success: false, error: 'Key and domain are required' });
  }
  
  if (domain === 'admin') {
    if (key === process.env.ADMIN_SECRET_KEY) {
      return res.status(200).json({ success: true });
    }
    return res.status(401).json({ success: false, error: 'Invalid admin key' });
  } else if (domain === 'software' || domain === 'hardware') {
    try {
      // Check if key exists and is unused in Supabase
      const { data, error } = await supabase
        .from('keys')
        .select('*')
        .eq('key', key.trim())
        .eq('used', false)
        .single();

      if (error || !data) {
        return res.status(401).json({ success: false, error: 'Invalid or already used key' });
      }

      // Mark the key as used
      const { error: updateError } = await supabase
        .from('keys')
        .update({ used: true })
        .eq('key', key.trim());

      if (updateError) {
        console.error('Error updating key:', updateError);
        return res.status(500).json({ success: false, error: 'Error processing key' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error verifying key:', error);
      return res.status(500).json({ success: false, error: 'Server error while verifying key' });
    }
  } else {
    return res.status(400).json({ success: false, error: 'Invalid domain' });
  }
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

    try {
    const { error } = await supabase
      .from('keys')
      .delete()
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // older than 10 mins

    if (error) {
      console.error('Error deleting old keys:', error);
    } else {
      console.log('Old keys deleted successfully');
    }
  } catch (err) {
    console.error('Interval error:', err);
  }
  
}, 10 * 60 * 1000); // every 10 minutes

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});