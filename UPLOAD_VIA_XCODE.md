# Upload App to App Store via Xcode

This guide shows you how to upload your Ayuuto app to the App Store using Xcode's Organizer or Transporter app.

---

## Prerequisites

- [ ] **macOS** (required for Xcode)
- [ ] **Xcode installed** (download from Mac App Store)
- [ ] **Apple Developer Account** ($99/year)
- [ ] **EAS build completed** (or local build)
- [ ] **App created in App Store Connect**

---

## Method 1: Using Xcode Organizer (Recommended)

### Step 1: Build Your App with EAS

First, build your app for App Store distribution:

```bash
cd "/Users/talhasmac/Documents/Ayuuto copy/ayuuto-mobile"
eas build --platform ios --profile production
```

**Wait for build to complete** (~15-20 minutes). You'll get a download link.

### Step 2: Download the .ipa File

1. **Copy the download link** from EAS build page
2. **Open the link** in your browser
3. **Download the `.ipa` file** to your Mac (usually Downloads folder)

### Step 3: Open Xcode Organizer

1. **Open Xcode** on your Mac
2. **Go to:** `Window` → `Organizer` (or press `Cmd + Shift + O` and type "Organizer")
3. **Click the "+" button** (top left of Organizer window)
4. **Select "Add..."** from the dropdown

### Step 4: Add Your .ipa File

1. **Navigate to** your Downloads folder (or wherever you saved the `.ipa` file)
2. **Select the `.ipa` file**
3. **Click "Open"**

The `.ipa` file will appear in the Organizer.

### Step 5: Distribute to App Store Connect

1. **Select your app** in the Organizer list
2. **Click "Distribute App"** button
3. **Choose distribution method:**
   - Select **"App Store Connect"**
   - Click **"Next"**
4. **Choose distribution options:**
   - Select **"Upload"** (to upload directly)
   - Click **"Next"**
5. **Review signing:**
   - Xcode will automatically detect the signing
   - Click **"Next"**
6. **Review summary:**
   - Check the details
   - Click **"Upload"**
7. **Wait for upload:**
   - Progress bar will show upload status
   - Usually takes 5-15 minutes depending on file size

### Step 6: Verify Upload

1. **Go to App Store Connect:** https://appstoreconnect.apple.com
2. **Select your app**
3. **Go to "TestFlight" tab**
4. **Check "Builds" section**
5. Your build should appear (may take 10-30 minutes to process)

---

## Method 2: Using Transporter App (Alternative)

Transporter is Apple's dedicated app for uploading builds. It's simpler than Xcode Organizer.

### Step 1: Install Transporter

1. **Open Mac App Store**
2. **Search for "Transporter"**
3. **Install** (it's free)

### Step 2: Download .ipa File

Same as Method 1 - download the `.ipa` from EAS build.

### Step 3: Upload via Transporter

1. **Open Transporter app**
2. **Sign in** with your Apple Developer account
3. **Drag and drop** your `.ipa` file into Transporter
4. **Click "Deliver"** button
5. **Wait for upload** (progress shown in app)

### Step 4: Verify Upload

Same as Method 1 - check App Store Connect → TestFlight → Builds

---

## Method 3: Build Locally and Upload

If you want to build locally instead of using EAS:

### Step 1: Build Locally

```bash
cd "/Users/talhasmac/Documents/Ayuuto copy/ayuuto-mobile"
eas build --platform ios --profile production --local
```

**Requirements:**
- macOS with Xcode installed
- Apple Developer account configured in Xcode
- All certificates and provisioning profiles set up

### Step 2: Find the .ipa File

After local build completes:
- The `.ipa` file will be in your project directory
- Usually in: `ayuuto-mobile/` or build output folder

### Step 3: Upload via Xcode or Transporter

Follow **Method 1** or **Method 2** above to upload.

---

## Troubleshooting

### Issue: "Invalid Bundle Identifier"
**Solution:**
- Ensure `com.ayuuto.app` matches in:
  - `app.json` → `ios.bundleIdentifier`
  - App Store Connect → Bundle ID
  - Xcode project settings

### Issue: "Code Signing Error"
**Solution:**
- Make sure you're signed in to Xcode with your Apple Developer account:
  - Xcode → Preferences → Accounts
  - Add your Apple ID
  - Select your team

### Issue: "Provisioning Profile Missing"
**Solution:**
- EAS handles this automatically if you used EAS build
- If building locally, you need to set up certificates in Xcode

### Issue: "Upload Failed"
**Solution:**
- Check your internet connection
- Try again (sometimes Apple's servers are busy)
- Use Transporter app instead (more reliable)

### Issue: "Build Not Appearing in App Store Connect"
**Solution:**
- Wait 10-30 minutes (processing takes time)
- Check email for any error notifications
- Verify the bundle ID matches exactly

---

## After Upload

### 1. Wait for Processing

- Build appears in TestFlight → Builds
- Processing usually takes 10-30 minutes
- You'll get an email when processing is complete

### 2. Select Build in App Store Connect

1. Go to **App Store** tab
2. Go to **Version Information**
3. Click **"+"** next to "iOS App"
4. **Select your build** from the list
5. **Save**

### 3. Complete App Store Listing

- Add screenshots
- Fill in description
- Add privacy policy URL
- Complete all required fields

### 4. Submit for Review

- Click **"Submit for Review"**
- Wait for Apple's review (24-48 hours typically)

---

## Quick Comparison

| Method | Pros | Cons |
|-------|------|------|
| **EAS Submit** | Easiest, automated | Requires EAS CLI |
| **Xcode Organizer** | Built into Xcode, visual | Requires Xcode |
| **Transporter** | Simple, dedicated app | Separate app to install |

---

## Recommended Workflow

1. **Build with EAS:** `eas build --platform ios --profile production`
2. **Download .ipa** from EAS
3. **Upload via Transporter** (easiest) or Xcode Organizer
4. **Wait for processing** in App Store Connect
5. **Select build** and submit for review

---

## Need Help?

- **Xcode Help:** https://developer.apple.com/xcode/
- **Transporter Guide:** https://help.apple.com/app-store-connect/#/devb1c185352
- **App Store Connect:** https://appstoreconnect.apple.com

---

**Note:** The easiest method is using **EAS Submit** (`eas submit --platform ios --profile production`), but if you prefer using Xcode, these methods work great too!
