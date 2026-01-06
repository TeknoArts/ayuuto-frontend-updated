# Quick Guide: Build Android APK

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

## Step 2: Login to Expo

```bash
eas login
```
(Create account at https://expo.dev if needed)

## Step 3: Configure Project

```bash
cd ayuuto-mobile
eas build:configure
```

This will:
- Create/update `eas.json`
- Link your project to Expo
- Set up your project ID

## Step 4: Build APK

```bash
eas build --platform android --profile preview
```

This will:
- Build the APK in the cloud
- Take about 10-15 minutes
- Give you a download link when done

## Step 5: Install on Device

1. Download the APK from the link provided
2. Transfer to your Android device
3. Enable "Install from Unknown Sources" in Android settings
4. Install the APK
5. Open the app and test!

## Testing Push Notifications

1. **Login to the app** - This registers your push token
2. **Create or open a group**
3. **Mark a payment as complete** - You should receive a notification
4. **Start next round** - You should receive a notification

## Notes

- APK builds take ~10-15 minutes
- You need an Expo account (free)
- Push notifications only work on physical devices (not emulators)
- The APK will be available for 30 days on Expo servers

## Troubleshooting

**Build fails?**
- Check: `eas whoami` (should show your account)
- Verify: `npx expo-doctor` (checks for issues)

**Can't install APK?**
- Enable "Install from Unknown Sources" in Android settings
- Uninstall any previous version first

**Notifications not working?**
- Must be on a physical device
- Check backend logs for token registration
- Verify Firebase service account key is in backend

