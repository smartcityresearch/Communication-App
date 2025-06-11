# Communication App

A real-time communication application built with Expo React Native and Express.js backend, designed for controlled access communication within organizations with integrated hardware display boards and push notifications.

## Features

### Core Functionality
- **Controlled Access Onboarding**: User registration with domain-based access (Software/Hardware/Admin)
- **Admin-Controlled Registration**: Secret password for admins, key-based registration for regular users
- **Real-time Push Notifications**: Custom sound notifications using FCM and Notifee
- **Message Acknowledgment System**: Read receipts with double-tick UI updates
- **Group Messaging**: Domain-based group notifications (ping software/hardware teams)
- **Hardware Integration**: ESP32-based display boards with buzzer alerts
- **SCRC Messenger Integration**: Pre-existing display board control functionality
- **Admin Panel**: Key generation and user management for administrators

### Technical Features
- **Real-time Updates**: Supabase realtime listeners for instant status updates
- **Offline Support**: AsyncStorage for local data persistence
- **Background Notifications**: Foreground and background notification handling
- **Security**: Database validation, key expiration, and cleanup cron jobs
- **Scalability**: Dockerized backend for easy deployment

## Requirements

### Frontend Dependencies(do npm install to get exact versions)
- Node.js(v18.19.1)
- Expo SDK 53
- React Native:
- Supabase Client
- Firebase Messaging
- Notifee for advanced notifications
- AsyncStorage for local data persistence

### Backend Dependencies
- Node.js(v18.19.1)
- Express.js
- Firebase Admin SDK
- Supabase
- Docker

### Hardware Requirements
- ESP32 microcontrollers for display boards
- Network connectivity (IIIT network for SCRC Messenger functionality)

## Installation & Setup

### Prerequisites
1. Node.js and npm installed
2. Android device with USB debugging enabled
3. Docker (for backend deployment)
4. Expo Go app version 53 on your device

### Backend Setup

#### Using Docker (Recommended)
```bash
# Navigate to backend directory
cd backend

# Build and run using Docker Compose
docker compose -f docker-compose.yaml up -d
```

#### Manual Setup(if already have correct node environment)
```bash
cd backend
npm install
npm start
```

### Frontend Setup

1. **Install dependencies**
```bash
npm install
```

3. **Build for development**
- install eas cli eas-cli/16.6.1 linux-x64 node-v18.19.1

```bash
eas build --platform android --profile development --local
```

4. **Install on device**
```bash
# Connect your Android device via USB
adb install [path-to-built-apk]
```

5. **Start development server**
```bash
npx expo start --dev-client
```

**Note**: Ensure your device and development machine are on the same WiFi network for development mode.

## Configuration Files

### google-services.json
This file is essential for Firebase Cloud Messaging (FCM) integration:
- Contains Firebase project configuration
- Enables push notification functionality
- Must be placed in the root directory of your Expo project
- Generated from Firebase Console for your specific project

### Firebase Admin SDK JSON
**File**: `test2-537f3-firebase-adminsdk-fbsvc-02eec8b1f1.json`
- Server-side Firebase authentication
- Enables backend to send FCM notifications
- Contains private keys and service account credentials
- Used by Express.js server for FCM API calls

### app.json
Expo configuration file containing:
- App metadata (name, version, description)
- Platform-specific settings
- Notification configuration
- Build settings and permissions

### eas.json
Expo Application Services configuration:
- Build profiles (development, preview, production)
- Environment-specific settings
- Build optimization parameters

## Project Structure

```
├── backend/
│   ├── server.js              # Main Express server
│   ├── Dockerfile             # Docker configuration
│   ├── docker-compose.yaml    # Docker Compose setup
│   ├── test2-537f3-firebase-adminsdk-fbsvc-02eec8b1f1.json
|   ├── .dockerignore
|   ├── .env
── app/
│   ├── index.jsx       # Notification handlers
│   |── _layout.tsx
|   ├── (home)
|        ├── index.jsx
|        ├── _layout.jsx
|        ├── messenger.jsx
|        ├── admin.jsx
├── lib/
│   ├── notifications.js       # Notification handlers
│   └── supabase.js           # Supabase client setup
├── assets/                   # Images and icons
├── styles/                   # Exported stylesheets
├── context/                  # User context management
├── android/app/src/main/res/raw/
│   └── meeting.wav           # Custom notification sound
├── app.json                  # Expo configuration
├── eas.json                  # EAS configuration
└── google-services.json      # Firebase configuration
```

## Detailed Working

### User Onboarding Flow
1. **Initial Registration**: Users enter name and select domain (Software/Hardware/Admin)
2. **Authentication**:
   - Admins: Enter secret password
   - Regular users: Request key from admin, enter generated key
3. **Key Validation**: Backend verifies key authenticity and marks as used
4. **Data Storage**: User details stored in Supabase and AsyncStorage
5. **FCM Setup**: FCM token generated and stored for notifications
6. **Permissions**: Notification permissions requested from user

### Core Communication Features

#### Individual Messaging
1. User selects recipient from registered users list
2. Custom message typed in modal
3. Backend validates sender/receiver existence
4. FCM notification sent with custom sound
5. Notification data stored in Supabase
6. Display board shows sender/receiver names with buzzer alert
7. Recipient can mark message as read
8. Real-time status update sent to sender (double-tick UI)

#### Group Messaging
1. Domain-based Firebase topics subscription
2. Group ping sends "{domain} meeting is gonna start!" message
3. All users in domain receive notification simultaneously

### Admin Panel Features
- **Key Generation**: Create secure random keys for user registration
- **User Management**: View and manage registered users
- **System Monitoring**: Access to notification logs and user activity

### Hardware Integration
- **ESP32 Display Boards**: HTTP server listening for message requests
- **Domain Mapping**: Messages routed to appropriate room displays
- **Buzzer Alerts**: Audio notifications for message arrival
- **Network Dependency**: Requires IIIT network for SCRC Messenger features

## API Endpoints

### Backend Routes
- **POST** `/send-ping`: Send individual notifications
- **POST** `/send-group-ping`: Send domain-based group notifications  
- **POST** `/mark-read`: Handle message read acknowledgments
- **POST** `/verify-key`: Validate registration keys during onboarding

## Scalability & Deployment

### Backend Scalability
- **Containerization**: Full Docker support with docker-compose
- **Database**: Supabase PostgreSQL for reliable data storage
- **Real-time**: Supabase real-time subscriptions for instant updates
- **Cleanup Jobs**: Automated database maintenance prevents bloating

### Frontend Scalability
- **Context Management**: Efficient state management with React Context
- **Local Storage**: AsyncStorage for offline functionality
- **Modular Architecture**: Separated concerns with dedicated folders

## Security Considerations

### Access Control
- Admin-controlled user registration
- Secret key authentication for admins
- Time-limited registration keys
- Database validation for all operations

### Data Protection
- Automatic cleanup of sensitive data
- Key expiration mechanisms
- Secure token management
- Network-based access restrictions for certain features

## Troubleshooting

### Common Issues
1. **Notification Permissions**: Ensure notification permissions are granted
2. **Network Connectivity**: Verify same WiFi network for development
3. **FCM Configuration**: Check google-services.json placement and validity
4. **Expo Version**: Ensure Expo Go app version 53 is installed
5. **USB Debugging**: Enable developer options and USB debugging on Android device

### Development Tips
- Use `npx expo start --dev-client` for development mode
- Check Supabase connection status in app logs
- Verify Firebase project configuration if notifications fail
- Monitor backend logs for API endpoint issues

## Additional Notes

### Custom Notification Sound
- **File**: `meeting.wav` placed in `android/app/src/main/res/raw/`
- Provides distinctive sound for communication notifications
- Helps users distinguish app notifications from others

### Database Management
- Automatic cleanup prevents database bloating
- Real-time listeners ensure instant UI updates
- Notification history maintained for user reference

### Future Enhancements
- iOS support with platform-specific configurations
- Enhanced admin analytics and reporting
- Additional hardware integrations
- Multi-language support


**Note**: This application requires proper Firebase and Supabase configuration. Ensure all API keys and configuration files are properly set up before deployment.