# Run App Directly on Connected Android Device

## Prerequisites

1. **Enable Developer Options on your Android phone:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Developer options will be enabled

2. **Enable USB Debugging:**
   - Go to Settings → Developer Options
   - Enable "USB Debugging"
   - Connect your phone via USB cable
   - Accept the "Allow USB Debugging" prompt on your phone

3. **Verify device is connected:**
   ```bash
   adb devices
   ```
   You should see your device listed

## Method 1: Using Expo Go (Quickest - No Build Required)

```bash
cd ayuuto-mobile
npx expo start
```

Then:
- Press `a` to open on Android device
- Or scan the QR code with Expo Go app

**Note:** Push notifications may not work fully in Expo Go. For full testing, use Method 2.

## Method 2: Development Build (Recommended for Push Notifications)

### Step 1: Build and Install Development Client

```bash
cd ayuuto-mobile
npx expo run:android
```

This will:
- Build the app for your connected device
- Install it automatically
- Launch it on your device

### Step 2: Start the Metro Bundler

After the app installs, start the development server:

```bash
npx expo start --dev-client
```

The app on your device will connect automatically.

## Method 3: Using EAS Build (For Production-like Testing)

If you want to test the exact APK that will be distributed:

```bash
# Build development build
eas build --platform android --profile development --local

# Or build preview build
eas build --platform android --profile preview --local
```

Then install the generated APK on your device.

## Troubleshooting

### Device not detected?
```bash
# Check if device is connected
adb devices

# If no devices, try:
adb kill-server
adb start-server
adb devices
```

### Build fails?
- Make sure Android SDK is installed
- Check that `ANDROID_HOME` is set
- Verify Java JDK is installed

### App won't connect to backend?
- Make sure your phone and laptop are on the same WiFi network
- Update `PHYSICAL_DEVICE_IP` in `utils/api.ts` to your laptop's IP
- Or use your laptop's IP address in the API configuration

## Testing Push Notifications

Once the app is running on your device:

1. **Login** - This registers your push token with the backend
2. **Check backend logs** - You should see "Push token registered successfully"
3. **Test notifications:**
   - Mark a payment as complete → Should receive notification
   - Start next round → Should receive notification
   - Complete a group → Should receive notification

## Quick Start (Recommended)

```bash
cd ayuuto-mobile

# Make sure device is connected
adb devices

# Build and run on device
npx expo run:android
```

This is the easiest way to test push notifications on your physical device!

