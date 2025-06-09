# Communication App - Test Case Documentation

## Test Overview
This document outlines comprehensive test cases for the Communication App, covering frontend functionality, backend API endpoints, and hardware integrations.

---

## 1. ONBOARDING SCREEN TEST CASES

### Test Case 1.1: Form Validation - Empty Fields
**Objective**: Verify that form validation prevents submission with empty fields

**Pre-conditions**: 
- App launched for first time
- User on onboarding screen

**Test Steps**:
1. Leave name field empty and attempt to submit
2. Leave domain field unselected and attempt to submit
3. Select admin domain but leave security key empty and attempt to submit
4. Select regular user domain but leave security key empty and attempt to submit

**Expected Results**:
- Error messages displayed for empty required fields
- Form submission blocked
- Submit button remains disabled/inactive
- User cannot proceed to next screen

**Test Data**: N/A (empty fields)

---

### Test Case 1.2: Security Key Validation - Invalid Key
**Objective**: Verify system handles invalid security keys correctly

**Pre-conditions**: 
- User on onboarding screen
- Valid name and domain entered

**Test Steps**:
1. Enter invalid admin password
2. Attempt to submit form
3. Enter invalid user registration key
4. Attempt to submit form

**Expected Results**:
- Error message: "Invalid security key"
- Form submission blocked
- Submit button remains disabled
- User remains on onboarding screen

**Test Data**: 
- Invalid admin password: "wrongpassword123"
- Invalid user key: "invalidkey456"

---

### Test Case 1.3: Submit Button State Management
**Objective**: Verify submit button behavior and state management

**Pre-conditions**: 
- User on onboarding screen

**Test Steps**:
1. Check initial submit button state (should be greyed out)
2. Fill valid name and domain
3. Enter valid security key
4. Observe submit button state change
5. Click submit button
6. Observe button state during processing

**Expected Results**:
- Initial state: Submit button greyed out/disabled
- After valid key: Submit button becomes active/enabled
- After clicking: Button becomes disabled to prevent multiple clicks
- Processing indication shown (loading state)

**Test Data**: 
- Valid admin password: [actual admin password]
- Valid user key: [generated key from admin]

---

### Test Case 1.4: Successful Onboarding Flow
**Objective**: Verify complete successful onboarding process

**Pre-conditions**: 
- Valid security key available
- Database accessible

**Test Steps**:
1. Enter valid name: "Test User"
2. Select domain: "Software"
3. Enter valid security key
4. Click submit
5. Wait for processing completion

**Expected Results**:
- User data stored in Supabase database
- User details saved in AsyncStorage
- FCM token generated and stored
- Navigation to main screen
- User context populated

**Test Data**: 
- Name: "Test User"
- Domain: "Software"
- Valid registration key

---

## 2. MAIN SCREEN TEST CASES

### Test Case 2.1: Notification Permission Handling
**Objective**: Verify app functionality when notification permissions are denied

**Pre-conditions**: 
- User successfully onboarded
- Notification permissions denied in device settings

**Test Steps**:
1. Launch app main screen
2. Attempt to send ping to another user
3. Verify app continues functioning
4. Check for any crashes or errors

**Expected Results**:
- App continues normal operation
- No crashes or error messages
- UI remains functional
- Notifications won't be received (expected behavior)
- Warning/info message about notification permissions (optional)

**Test Data**: N/A

---

### Test Case 2.2: Individual Ping Functionality
**Objective**: Verify individual ping messaging works correctly

**Pre-conditions**: 
- Two users registered and onboarded
- Notification permissions granted
- Both users online

**Test Steps**:
1. User A selects User B from list
2. Click ping button beside User B's name
3. Enter custom message: "Test message for individual ping"
4. Send message
5. Observe button state during processing
6. Check User B's device for notification

**Expected Results**:
- Ping button disabled after clicking
- Success popup displayed after completion
- Custom notification sound plays on User B's device
- Notification contains custom message
- "Mark as read" button present in notification
- Display board shows: "{User A} has sent message to {User B}"
- Buzzer alert on appropriate display board

**Test Data**: 
- Message: "Test message for individual ping"
- Users: User A (sender), User B (receiver)

---

### Test Case 2.3: Group Ping Functionality
**Objective**: Verify domain-based group messaging

**Pre-conditions**: 
- Multiple users registered in same domain
- User has admin or regular access

**Test Steps**:
1. Click on group ping option
2. Select domain: "Software"
3. Send group ping
4. Check all software domain users receive notification

**Expected Results**:
- All users in "Software" domain receive notification
- Message: "Software meet is starting!"
- Custom notification sound plays
- Display board in software room shows: "Software meet is starting!"
- Success confirmation for sender

**Test Data**: 
- Domain: "Software"
- Expected message: "Software meet is starting!"

---

### Test Case 2.4: Mark as Read Functionality
**Objective**: Verify read receipt system works in foreground and background

**Pre-conditions**: 
- Notification sent from User A to User B
- User B has received notification

**Test Steps**:
**Foreground Test**:
1. User B opens app while notification visible
2. Tap "Mark as read" button in notification
3. Check User A's sent section for status update

**Background Test**:
1. User B receives notification while app in background
2. Tap notification to open app
3. Check User A's sent section for status update

**Expected Results**:
- User A's sent section shows green double tick
- Real-time UI update (no refresh needed)
- Notification status updated in database
- Timestamp of read status recorded

**Test Data**: 
- Notification ID: [generated unique ID]

---

### Test Case 2.5: Sent Notifications UI Management
**Objective**: Verify sent notifications section and clear functionality

**Pre-conditions**: 
- User has sent multiple notifications
- Some notifications read, some unread

**Test Steps**:
1. Navigate to main screen sent section
2. Observe list of sent notifications
3. Check status indicators (single tick vs double tick)
4. Click "Clear" button
5. Confirm all sent notifications removed

**Expected Results**:
- All sent notifications visible with proper status
- Unread: Single grey tick
- Read: Double green tick
- Clear button removes all sent notifications
- UI updates immediately
- Local storage cleared

**Test Data**: 
- Multiple test notifications with mixed read status

---

## 3. SCRC MESSENGER TEST CASES

### Test Case 3.1: Message Length Validation
**Objective**: Verify character limit enforcement per line

**Pre-conditions**: 
- User on SCRC Messenger tab
- Connected to IIIT network

**Test Steps**:
1. Enter text longer than 10 characters in line 1
2. Attempt to continue typing
3. Try entering 11+ characters in other lines
4. Attempt to submit form

**Expected Results**:
- Error message displayed when exceeding 10 characters
- Form submission blocked for invalid input
- Character count indicator (if implemented)
- User prevented from entering excess characters

**Test Data**: 
- Line 1: "This is more than ten characters"
- Expected: Error after 10th character

---

### Test Case 3.2: Four-Line Message Display
**Objective**: Verify messages display correctly on designated screens

**Pre-conditions**: 
- Connected to IIIT network
- Display boards operational
- SCRC Messenger functionality enabled

**Test Steps**:
1. Enter valid 4-line message (≤10 chars per line):
   - Line 1: "MEETING"
   - Line 2: "TODAY"
   - Line 3: "3 PM"
   - Line 4: "LAB 101"
2. Submit message
3. Check corresponding display boards
4. Verify message appears on software screen

**Expected Results**:
- Message displays on physical display boards
- Text appears on software screen interface
- All 4 lines visible and properly formatted
- Message persists for appropriate duration

**Test Data**: 
```
Line 1: "MEETING"
Line 2: "TODAY" 
Line 3: "3 PM"
Line 4: "LAB 101"
```

---

## 4. ADMIN PANEL TEST CASES

### Test Case 4.1: Key Generation Functionality
**Objective**: Verify admin can generate registration keys securely

**Pre-conditions**: 
- User logged in as admin
- Admin panel accessible

**Test Steps**:
1. Navigate to admin panel
2. Click "Generate Key" button
3. Observe button state during processing
4. Check generated key display
5. Attempt to click generate button again
6. Verify key stored in database

**Expected Results**:
- Generate button disabled after clicking
- Processing indicator shown
- Unique secure key generated and displayed
- Key visible on admin screen
- Button remains disabled to prevent multiple generation
- Key stored in Supabase database with timestamp

**Test Data**: 
- Generated key format: [secure random string]

---

### Test Case 4.2: Key Generation Security
**Objective**: Verify key generation creates unique, secure keys

**Pre-conditions**: 
- Admin access available

**Test Steps**:
1. Generate first key and record it
2. Wait for button to re-enable (if applicable)
3. Generate second key
4. Compare both keys for uniqueness
5. Check key format and length

**Expected Results**:
- Each generated key is unique
- Keys meet security requirements (length, complexity)
- No duplicate keys created
- Keys have proper expiration timestamps

**Test Data**: 
- Key 1: [first generated key]
- Key 2: [second generated key]

---

## 5. SERVER/BACKEND TEST CASES

### Test Case 5.1: API Endpoint Testing - Send Ping
**Objective**: Verify /send-ping endpoint functionality

**Test Method**: API Testing Tool (Postman/curl)

**Test Steps**:
1. Send POST request to `/send-ping`
2. Include valid sender/receiver IDs
3. Include custom message
4. Verify response status and data

**Request Body**:
```json
{
  "senderId": "user123",
  "receiverId": "user456", 
  "message": "Test ping message",
  "senderName": "Test Sender",
  "receiverName": "Test Receiver"
}
```

**Expected Results**:
- Status: 200 OK
- FCM notification sent successfully
- Response includes success confirmation
- Database updated with notification record

---

### Test Case 5.2: API Endpoint Testing - Mark as Read
**Objective**: Verify /mark-read endpoint functionality

**Test Steps**:
1. Send POST request to `/mark-read`
2. Include valid notification ID
3. Check database update
4. Verify real-time update trigger

**Request Body**:
```json
{
  "notificationId": "notif_12345",
  "readAt": "2025-06-09T10:30:00Z"
}
```

**Expected Results**:
- Status: 200 OK
- Database record updated
- Real-time listener triggered
- Sender receives status update

---

### Test Case 5.3: API Endpoint Testing - Verify Key
**Objective**: Verify /verify-key endpoint security

**Test Steps**:
1. Test with valid unused key
2. Test with invalid key
3. Test with already used key
4. Verify key status updates

**Request Body**:
```json
{
  "key": "test_key_12345",
  "userId": "user789"
}
```

**Expected Results**:
- Valid unused key: 200 OK, key marked as used
- Invalid key: 401 Unauthorized
- Used key: 403 Forbidden
- Proper error messages returned

---

### Test Case 5.4: Cron Job Testing
**Objective**: Verify automated cleanup jobs function correctly

**Pre-conditions**: 
- Server running with cron jobs enabled
- Test data in notifications and keys tables

**Test Steps**:
1. Monitor server logs for 10-minute intervals
2. Check database before and after cron execution
3. Verify old notifications deleted
4. Verify expired keys deleted
5. Confirm log messages appear

**Expected Results**:
- Server logs show: "Old data deleted" every 10 minutes
- Notifications older than threshold removed
- Expired keys removed from database
- Database size maintained efficiently
- No errors in cron job execution

**Log Monitoring**:
```
[2025-06-09 10:00:00] Cron job started - cleaning notifications
[2025-06-09 10:00:01] Deleted 15 old notifications
[2025-06-09 10:00:01] Cron job started - cleaning keys  
[2025-06-09 10:00:02] Deleted 3 expired keys
[2025-06-09 10:00:02] Old data deleted
```

---

## 6. INTEGRATION TEST CASES

### Test Case 6.1: End-to-End Message Flow
**Objective**: Verify complete message flow from sender to receiver

**Test Steps**:
1. User A sends ping to User B
2. Verify FCM notification delivery
3. Check display board update
4. User B marks as read
5. Verify status update to User A

**Expected Results**:
- Complete flow works without errors
- All components update correctly
- Real-time synchronization maintained

---

### Test Case 6.2: Hardware Integration Testing
**Objective**: Verify ESP32 display board integration

**Pre-conditions**: 
- ESP32 boards connected and operational
- Network connectivity established

**Test Steps**:
1. Send individual ping message
2. Check appropriate display board updates
3. Verify buzzer activation
4. Send group ping
5. Check group message display

**Expected Results**:
- Correct display board receives message
- Buzzer activates for alert
- Message format correct on display
- Hardware responds within acceptable time

---

## Test Execution Guidelines

### Test Environment Setup
- **Frontend**: Expo development build on physical Android device
- **Backend**: Docker container running locally or deployed server
- **Database**: Supabase instance with test data
- **Hardware**: ESP32 boards connected to test network

### Test Data Management
- Use dedicated test user accounts
- Clean up test data after each test cycle
- Maintain separate test database if possible
- Document all test credentials securely

### Success Criteria
- All test cases pass without critical failures
- Performance meets acceptable thresholds
- Security validations work correctly
- User experience flows smoothly
- Hardware integrations function reliably

### Bug Reporting Format
```
Bug ID: [Unique identifier]
Test Case: [Reference to failed test case]
Description: [Brief description of issue]
Steps to Reproduce: [Detailed steps]
Expected Result: [What should happen]
Actual Result: [What actually happened]
Severity: [Critical/High/Medium/Low]
Environment: [Test environment details]
Screenshots: [If applicable]
```

---

## Test Schedule Recommendations

### Daily Testing
- Core messaging functionality
- API endpoint health checks
- Basic UI functionality

### Weekly Testing  
- Complete test suite execution
- Performance testing
- Security validation
- Hardware integration testing

### Pre-Release Testing
- Full regression testing
- Load testing with multiple users
- Extended hardware testing
- Database cleanup verification