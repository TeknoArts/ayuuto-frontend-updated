# Build Android APK for Testing Push Notifications

## Prerequisites

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo account:**
   ```bash
   eas login
   ```
   (Create an account at https://expo.dev if you don't have one)

3. **Link your project to Expo:**
   ```bash
   cd ayuuto-mobile
   eas build:configure
   ```

## Build APK

### Option 1: Build APK for Testing (Recommended)

```bash
cd ayuuto-mobile
eas build --platform android --profile preview
```

This will:
- Build an APK file
- Upload it to Expo servers
- Give you a download link

### Option 2: Build Development APK

```bash
cd ayuuto-mobile
eas build --platform android --profile development
```

## Download and Install APK

1. After the build completes, you'll get a download link
2. Download the APK file to your Android device
3. Enable "Install from Unknown Sources" on your Android device:
   - Settings → Security → Unknown Sources (enable)
4. Install the APK on your device
5. Open the app and test push notifications

## Important Notes for Push Notifications

### Firebase Configuration

For push notifications to work, you need to:

1. **Get your Expo Project ID:**
   ```bash
   eas project:info
   ```

2. **Update `utils/notifications.ts`:**
   - The project ID will be shown after running `eas build:configure`
   - Or check it in your Expo dashboard

3. **Firebase Cloud Messaging (FCM):**
   - Push notifications use Expo's push notification service
   - Expo handles FCM integration automatically
   - No need to manually configure FCM credentials

### Testing Push Notifications

1. **Install APK on a physical Android device** (not emulator)
2. **Login to the app** - this will register the push token
3. **Test notifications:**
   - Mark a payment as complete
   - Start a next round
   - Complete a group

## Alternative: Local Build (Advanced)

If you want to build locally (requires Android SDK):

```bash
cd ayuuto-mobile
eas build --platform android --profile preview --local
```

This requires:
- Android SDK installed
- Java Development Kit (JDK)
- More setup time

## Troubleshooting

### Build fails
- Check your Expo account is logged in: `eas whoami`
- Verify app.json is valid: `npx expo-doctor`

### Notifications not working
- Ensure you're testing on a physical device
- Check that push token is registered (check backend logs)
- Verify Firebase service account key is in backend

### APK won't install
- Enable "Install from Unknown Sources"
- Check Android version compatibility
- Try uninstalling any previous version first

