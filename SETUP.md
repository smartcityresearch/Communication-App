# 🔧 Project Setup Guide

## 1.Clone the Repository

```bash
git clone 
cd Communication-App    
npm install

# Install backend dependencies
cd backend
npm install
```

---

## 2. Firebase Setup

### Step-by-Step:

1. Go to [Firebase Console](https://console.firebase.google.com/) and **create a new project**.
2. Click the **Android icon** and:
   - Use the **package name** from `app.json` (e.g., `"com.username.scrcmessenger`), or, use your custom name but modify it in the app.json
   - Register the app.
3. Download the `google-services.json` file and place it in the **project root**.
4. In Firebase Console, go to **Settings → Service Accounts**, and:
   - Click **Generate new private key**.
   - Save the downloaded JSON to the `/backend` directory.
   - In `server.js`, replace `serviceAccount` path with the name of this file.

### Verify Firebase Setup:

- Delete `android` and `ios` folders:
  ```bash
  rm -rf android ios
  ```
- Rebuild native folders:
  ```bash
  npx expo prebuild
  ```

### Firebase Android Configurations:

- Open `android/app/src/main/AndroidManifest.xml`

- Add the following attributeinside `<application>`:

  ```xml
  android:usesCleartextTraffic="true"
  ```
to allow HTTP requests, which are blocked by default.

- Ensure `cloud messaging` is enabled under Firebase **Project Settings**.

### EAS Build Setup:

```bash
rm eas.json
npx eas init
```
Add this to the production part in eas.json
```
 "android": {
    "buildType": "apk"
  },
  ```
---

## 3. Supabase Setup

### Step-by-Step:

1. Go to [Supabase](https://app.supabase.com/) and **create a new project**.
2. Create the following tables:

#### `users` Table

```sql
create table public.users (
  id serial primary key,
  fcm_token text unique not null,
  name text not null,
  domain text check (
    domain = any (array['software', 'hardware', 'admin'])
  )
);
```

#### `notifications` Table

```sql
create table public.notifications (
  id uuid primary key default extensions.uuid_generate_v4(),
  sender_id integer references users(id) on delete cascade,
  recipient_id integer references users(id) on delete cascade,
  status text default 'sent',
  message text,
  created_at timestamp default now()
);
create index if not exists idx_notifications_sender on public.notifications(sender_id);
create index if not exists idx_notifications_recipient on public.notifications(recipient_id);
```

#### `keys` Table

```sql
create table public.keys (
  id serial primary key,
  key text unique not null,
  used boolean default false,
  created_at timestamp default now()
);
```

3. In Supabase project → **Connect → App Frameworks**:

   - Copy the **Project URL** and **Anon Key**.
   - Paste them in `/lib/supabase.js` in the project directory.

4. Enable **Realtime** for the `notifications` table.

---

## 4. Backend Setup

### Option 1: Run Locally

```bash
cd backend
node server.js
```

### Option 2: Run with Docker

```bash
cd backend
docker-compose up --build
```

---

## 5. App Build & Run

### Requirements:

- **Android Studio** installed
- Recommended **16 GB RAM**
- Set RAM for build:
  ```bash
  export JAVA_OPTS="-Xmx4g"
  ```

### Local Android Build(run based on whether production or deevlopment build):

```bash
npx eas build --platform android --local --profile production
npx eas build --platform android --local --profile development  
```

### Cloud Build (Expo Servers):

```bash
npx eas build --platform android --profile production  # Remove --local
```

### Install APK:

- Use `adb install` or transfer `.apk` to phone and install manually.

### Dev Mode with Expo Go (SDK 53):

1. Make sure Expo Go is installed on your phone.
2. Log in to your Expo account on both PC and phone:
   ```bash
   npx expo login
   ```
3. Start the development client:
   ```bash
   npx expo start --dev-client
   ```
4. Open Expo Go and scan QR → app should launch with backend integration.

---

## Summary

| Task              | Tool/Command                      |
| ----------------- | --------------------------------- |
| Clone repo        | `git clone` → `npm install`       |
| Firebase setup    | Console + JSONs + `expo prebuild` |
| Supabase setup    | Create tables + Enable Realtime   |
| Backend start     | `node server.js` or Docker        |
| Build app locally | `npx eas build --local`           |
| Dev testing       | `npx expo start --dev-client`     |

---
