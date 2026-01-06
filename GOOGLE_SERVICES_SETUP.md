# Google Services JSON Setup Guide

## Important Note

**With Expo's `expo-notifications`, you typically DON'T need `google-services.json`** because Expo handles FCM integration automatically through their push notification service.

However, if you want **direct FCM integration** (bypassing Expo's service), follow the steps below.

## When You Need google-services.json

You need `google-services.json` if:
- You want direct FCM integration (not using Expo's push service)
- You're using Firebase features beyond push notifications
- You're building a bare React Native app (not using Expo managed workflow)

## Step 1: Download google-services.json

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **ayuuto-3904b**
3. Click the **⚙️ Settings** icon → **Project settings**
4. Scroll down to **Your apps** section
5. If you don't have an Android app yet:
   - Click **Add app** → Select **Android**
   - Enter package name: `com.technoarts.ayuuto`
   - Click **Register app**
6. Download the `google-services.json` file

## Step 2: Place the File

Place the downloaded `google-services.json` file in:

```
ayuuto-mobile/android/app/google-services.json
```

**File structure:**
```
ayuuto-mobile/
  android/
    app/
      google-services.json  ← Place it here
      build.gradle
      src/
      ...
```

## Step 3: Update build.gradle Files

### 3.1 Update Root build.gradle

Edit `ayuuto-mobile/android/build.gradle`:

```gradle
buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath('com.android.tools.build:gradle')
    classpath('com.facebook.react:react-native-gradle-plugin')
    classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')
    // Add this line:
    classpath('com.google.gms:google-services:4.4.0')
  }
}
```

### 3.2 Update App build.gradle

Edit `ayuuto-mobile/android/app/build.gradle`:

Add at the **bottom** of the file (after all other plugins):

```gradle
// Add this at the very end of the file
apply plugin: 'com.google.gms.google-services'
```

## Step 4: Verify Configuration

After adding the file and updating build.gradle:

1. **Sync Gradle** (Android Studio will prompt you, or run):
   ```bash
   cd ayuuto-mobile/android
   ./gradlew clean
   ```

2. **Rebuild the app**:
   ```bash
   cd ayuuto-mobile
   npx expo run:android
   ```

## Current Setup (Expo Notifications)

Your current setup uses **Expo's push notification service**, which:
- ✅ Works without `google-services.json`
- ✅ Handles FCM automatically
- ✅ Simpler setup
- ✅ Works with `expo-notifications` package

**You only need `google-services.json` if you want to:**
- Use Firebase features directly (Analytics, Crashlytics, etc.)
- Bypass Expo's push service
- Have more control over FCM configuration

## Troubleshooting

### Error: "google-services.json not found"
- Make sure the file is in `android/app/google-services.json`
- Check the file name is exactly `google-services.json` (case-sensitive)

### Error: "Plugin with id 'com.google.gms.google-services' not found"
- Make sure you added the classpath in the root `build.gradle`
- Sync Gradle files

### Build fails after adding google-services.json
- Make sure the package name in `google-services.json` matches `com.technoarts.ayuuto`
- Check that you added the plugin at the **end** of `app/build.gradle`

## Recommendation

**For your current setup, you DON'T need `google-services.json`** because:
- You're using `expo-notifications` which handles FCM automatically
- Your backend uses Firebase Admin SDK (which uses the service account key)
- Expo manages the FCM integration for you

Only add `google-services.json` if you specifically need direct Firebase features beyond push notifications.

