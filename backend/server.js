// imports
const express = require('express');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });
const axios=require('axios');
import displayBoardURL from './urls.json';

const app = express();
//middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase from firebase config file.
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//retireve credentials from .env and create supabase client for CRUD operations.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

//Endpoint to handle individual ping
app.post('/send-ping', async (req, res) => {
  try {
    const { sender_id, recipient_id, sender_token, message = 'Ping!' } = req.body;
    
    // Input validation to check request format, ie, if sender and receiver id's exist in DB
    if (!sender_id || !recipient_id) {
      return res.status(400).json({ error: 'Missing sender or recipient ID' });
    }

    //Additional security check to validate if sender fcm token is same as that in DB(prevents attacks)
    const { data: sender, error: senderError } = await supabase
  .from('users')
  .select('id, name')
  .eq('id', sender_id)
  .eq('fcm_token', sender_token)
  .single();
  if(!sender || senderError){
    console.error('Sender error:', senderError);
    return res.status(401).json({ error: 'Unauthorized access' });
  } 
  else console.log('Sender validated');

    // Get recipient info
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('fcm_token, name,domain')
      .eq('id', recipient_id)
      .single();

    if (recipientError || !recipient) {
      console.error('Recipient error:', recipientError);
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Insert notification data into notifications table in supabase
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
    }else{
      console.log('Notification added to database..');
    }

    // Send push notification to recipient - FIXED PAYLOAD
    const messagePayload = {
      token: recipient.fcm_token,
      notification: { 
        title: 'New Ping!', 
        body: `${sender.name}: ${message}`
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
    //delivering push notification via firebase
    await admin.messaging().send(messagePayload);
    //Display Messages on display boards corresponding to recipient's domain
//     for (const url of displayBoardURL[recipient.domain] || []) {
//   await axios.get(`${url}${sender?.name}%20sent%20msg%20to%20${recipient.name}`);
// }
    console.log('Ping sent');
    res.json({ success: true, notification });
    //error handling
  } catch (error) {
    console.error('Error sending ping:', error);
    res.status(500).json({ error: error.message });
  }
});


//Endpoint to mark notificationas as read
app.post('/mark-read', async (req, res) => {
  try {
    const { notification_id } = req.body; //ender_id, sender_token, 

  console.log('Marking notification as read:', notification_id);
    // //fetching notification before updating its status as read
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notification_id)
      .single();

    if (!notification || fetchError) {
      console.error('Error fetching notification:', fetchError);
      return res.status(404).json({ error: 'Notification not found' });
    }

    //updating notification status as read
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


//Endpoint to handle domain group pings
app.post('/send-group-ping', async (req, res) => {
  const { topic, message, sender_token } = req.body; 
  const finalMessage = message || `${topic} meeting is starting!`; // fallback mesage if empty text
   //validate user
    const { data: validUser, error: invalidError } = await supabase
  .from('users')
  .select('id, name') // select only necessary fields
  .eq('fcm_token', sender_token)
  .single();
  if(!validUser || invalidError) return res.status(401).json({ error: 'Unauthorized access' });
  else console.log('User validated.');

  //send push notification
  try {
    await admin.messaging().send({
      topic,
      notification: {
        title: 'Group Ping',
        body: finalMessage,
      }
    });   
    //corresponding display boards to see the message
    // for (const url of displayBoardURL[topic]) {
    //     await axios.get(`${url}${encodeURIComponent(finalMessage)}`);
    // }
    console.log('Group ping sent');
    res.status(200).json({ success: true, message: 'Group ping sent' });
  } catch (error) {
    console.error('FCM error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


//Endpoint to verify security key
app.post('/verify-key', async (req, res) => {
  const { key, domain } = req.body;
  //if empty fields sent with request
  if (!key || !domain) {
    return res.status(400).json({ success: false, error: 'Key and domain are required' });
  }
  //for admin- checks with predefined key stored in .env
  if (domain === 'admin') {
    if (key === process.env.ADMIN_SECRET_KEY) {
      return res.status(200).json({ success: true });
    }
    return res.status(401).json({ success: false, error: 'Invalid admin key' });
  } 
  //for other domains -checks if entered key is a valid unusued key in supabase
  else if (domain === 'software' || domain === 'hardware') {
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
      console.log('Key verified');
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error verifying key:', error);
      return res.status(500).json({ success: false, error: 'Server error while verifying key' });
    }
  } else {
    return res.status(400).json({ success: false, error: 'Invalid domain' });
  }
});

//Cron job- deletes data older than 10 minutes in notifications table[to prevent bloat] and keys table[security] 
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