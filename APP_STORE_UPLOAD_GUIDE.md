# Upload Ayuuto App to Apple App Store - Step-by-Step Guide

## ✅ Prerequisites Checklist

Before starting, make sure you have:

- [ ] **Apple Developer Account** ($99/year)
  - Sign up: https://developer.apple.com/programs/
  - Wait for approval (usually 24-48 hours)

- [ ] **EAS CLI installed**
  ```bash
  npm install -g eas-cli
  ```

- [ ] **Logged into Expo**
  ```bash
  eas login
  ```

- [ ] **Privacy Policy URL** (REQUIRED)
  - Must be publicly accessible
  - You can host it on:
    - GitHub Pages (free)
    - Your website
    - Any public URL
  - Example: `https://yourusername.github.io/ayuuto-privacy-policy`
  - Or use: `mailto:hello@ayuuto.app` (if you have a support page)

---

## 🚀 Step 1: Build Your iOS App

### 1.1 Navigate to your project
```bash
cd "/Users/talhasmac/Documents/Ayuuto copy/ayuuto-mobile"
```

### 1.2 Build for App Store
```bash
eas build --platform ios --profile production
```

**What happens:**
1. EAS will ask about credentials (first time only)
   - Choose: **"Let EAS handle credentials"** (easiest option)
   - EAS will automatically create certificates and provisioning profiles
2. Build will start in the cloud
3. Wait ~15-20 minutes
4. You'll get a download link when done

**Note:** The build will create an `.ipa` file ready for App Store submission.

---

## 📱 Step 2: Create App in App Store Connect

### 2.1 Go to App Store Connect
1. Visit: https://appstoreconnect.apple.com
2. Login with your **Apple Developer account**

### 2.2 Create New App
1. Click **"+"** button (top left)
2. Select **"New App"**
3. Fill in the form:
   - **Platform:** iOS
   - **Name:** Ayuuto
   - **Primary Language:** English
   - **Bundle ID:** `com.ayuuto.app` (must match your app.json)
   - **SKU:** `ayuuto-ios-001` (any unique identifier)
   - **User Access:** Full Access (or Limited if you have a team)
4. Click **"Create"**

---

## 📝 Step 3: Prepare App Store Listing

### 3.1 App Information

Go to your app in App Store Connect → **App Information** tab:

1. **Name:** Ayuuto (max 30 characters)
2. **Subtitle:** "Group Savings Made Easy" (max 30 characters)
3. **Category:** 
   - Primary: **Finance**
   - Secondary: **Lifestyle** (optional)
4. **Privacy Policy URL:** **REQUIRED**
   - Enter your publicly accessible privacy policy URL
   - Example: `https://yourusername.github.io/ayuuto-privacy-policy`
5. **Support URL:** **REQUIRED**
   - Can be: `mailto:hello@ayuuto.app`
   - Or your support website

### 3.2 App Description

Go to **App Store** tab → **Version Information**:

**Description (max 4000 characters):**
```
Ayuuto is a group savings app that helps you organize and manage rotating savings groups (Ayuutos) with friends, family, or community members.

Key Features:
• Create and manage savings groups
• Set collection amounts and schedules
• Track payments and contributions
• Organize group members and rounds
• Receive notifications for group activities
• Share groups with participants via email

Perfect for:
• Community savings groups
• Family savings circles
• Friend groups saving together
• Rotating credit associations

Ayuuto makes it easy to stay organized and ensure everyone contributes fairly. All savings arrangements and payments take place directly between users - Ayuuto does not handle any money or financial transactions.

Start organizing your savings group today!
```

**Keywords (max 100 characters, comma-separated):**
```
savings,group,rotating,credit,finance,community,ayyuto,ayyuuto,collective
```

**Promotional Text (optional, max 170 characters):**
```
Organize your group savings with ease. Track contributions, manage rounds, and stay connected with your savings group.
```

**What's New in This Version:**
```
Initial release of Ayuuto - Group Savings Made Easy
```

### 3.3 Screenshots (REQUIRED)

You need screenshots for at least these device sizes:

**iPhone 6.7" Display (iPhone 14 Pro Max, 15 Pro Max, etc.):**
- Resolution: **1290 x 2796 pixels**
- At least 1 screenshot (up to 10)
- Format: PNG or JPEG

**iPhone 6.5" Display (iPhone 11 Pro Max, XS Max, etc.):**
- Resolution: **1242 x 2688 pixels**
- At least 1 screenshot (up to 10)

**iPhone 5.5" Display (iPhone 8 Plus, 7 Plus, etc.):**
- Resolution: **1242 x 2208 pixels**
- At least 1 screenshot (up to 10)

**How to Create Screenshots:**

1. **Using iOS Simulator:**
   ```bash
   # Start your app in simulator
   cd ayuuto-mobile
   npx expo run:ios
   
   # In Simulator:
   # - Navigate to different screens
   # - Press Cmd + S to take screenshot
   # - Screenshots saved to Desktop
   ```

2. **Recommended Screenshots:**
   - Home screen showing groups
   - Group details screen
   - Create new group screen
   - Settings screen
   - Payment processing screen

3. **Upload to App Store Connect:**
   - Go to App Store tab → Version Information
   - Scroll to Screenshots section
   - Drag and drop screenshots for each device size

---

## 🔒 Step 4: App Privacy Questions

Go to **App Privacy** tab in App Store Connect:

1. **Does your app collect data?**
   - Select: **Yes**

2. **What types of data?**
   - Select: **Name, Email Address, Phone Number**

3. **How is data used?**
   - Select: **App Functionality** (to identify users in groups)

4. **Is data linked to user?**
   - Select: **Yes** (to identify users)

5. **Is data used for tracking?**
   - Select: **No**

6. **Is data shared with third parties?**
   - Select: **No**

7. **Privacy Policy URL:**
   - Enter your privacy policy URL

---

## 📤 Step 5: Upload Build to App Store Connect

### Option A: Using EAS Submit (Easiest - Recommended)

```bash
cd "/Users/talhasmac/Documents/Ayuuto copy/ayuuto-mobile"
eas submit --platform ios --profile production
```

**What happens:**
1. EAS will ask for your Apple ID credentials
2. It will upload the `.ipa` file automatically
3. Build will appear in App Store Connect → TestFlight → Builds
4. Wait for processing (usually 10-30 minutes)

### Option B: Manual Upload via Transporter

1. **Download the `.ipa` file** from EAS build page
2. **Install Transporter app** from Mac App Store (free)
3. **Open Transporter**
4. **Drag and drop** the `.ipa` file
5. **Click "Deliver"**
6. Wait for upload and processing

---

## ✅ Step 6: Complete Version Information

After your build is processed:

1. Go to **App Store** tab → **Version Information**
2. **Select your build:**
   - Click "+" next to "iOS App"
   - Select the build you just uploaded
   - Wait for processing to complete

3. **Complete all required fields:**
   - ✅ App description
   - ✅ Keywords
   - ✅ Support URL
   - ✅ Privacy Policy URL
   - ✅ Screenshots (at least one for each required size)
   - ✅ App icon (1024x1024, already configured)

4. **App Review Information:**
   - **Contact Information:** Your email
   - **Phone Number:** Your phone number
   - **Demo Account (if needed):** Leave blank if not required
   - **Notes:** Any special instructions for reviewers

---

## 🎯 Step 7: Submit for Review

1. **Review everything:**
   - Check all information is complete
   - Verify screenshots look good
   - Ensure privacy policy URL works

2. **Click "Submit for Review"** button (top right)

3. **Wait for Review:**
   - Typically takes 24-48 hours
   - You'll receive email notifications
   - Check status in App Store Connect

---

## 📊 Step 8: Monitor Review Status

Check your app status in App Store Connect:

- **Waiting for Review:** Your app is in queue
- **In Review:** Apple is reviewing your app
- **Pending Developer Release:** Approved, waiting for you to release
- **Ready for Sale:** Your app is live!
- **Rejected:** Review feedback provided, fix issues and resubmit

---

## 🐛 Common Issues & Solutions

### Issue: "Missing Privacy Policy URL"
**Solution:** 
- You MUST have a publicly accessible privacy policy
- Host it on GitHub Pages, your website, or any public URL
- Test the URL in a browser to ensure it's accessible

### Issue: "Invalid Bundle Identifier"
**Solution:**
- Ensure `com.ayuuto.app` matches exactly in:
  - `app.json` → `ios.bundleIdentifier`
  - App Store Connect → Bundle ID
- Bundle IDs are case-sensitive

### Issue: "Missing Screenshots"
**Solution:**
- You need at least 1 screenshot for each required device size
- Use iOS Simulator to take screenshots
- Screenshots must be exact resolution (no scaling)

### Issue: "Build Processing Failed"
**Solution:**
- Check EAS build logs for errors
- Ensure all dependencies are properly configured
- Try rebuilding: `eas build --platform ios --profile production --clear-cache`

### Issue: "App Review Rejected"
**Solution:**
- Read the rejection reason carefully
- Fix the issues mentioned
- Resubmit with updated build (increment `buildNumber` in app.json)

---

## 📝 Important Notes

1. **Build Number:** Increment `buildNumber` in `app.json` for each new submission
   - Current: `"buildNumber": "1"`
   - Next: `"buildNumber": "2"`

2. **Version Number:** Increment `version` for major updates
   - Current: `"version": "1.0.0"`
   - Next: `"version": "1.1.0"`

3. **Privacy Policy:** Must be publicly accessible and match the content in your app

4. **Support URL:** Can be an email (`mailto:hello@ayuuto.app`) or website

5. **First Submission:** May take longer (up to 7 days) for first-time submissions

---

## 🎉 After Approval

Once your app is approved:

1. **Release Options:**
   - **Automatic Release:** App goes live immediately after approval
   - **Manual Release:** You control when to release

2. **Monitor:**
   - Check App Store Connect for analytics
   - Respond to user reviews
   - Monitor crash reports

3. **Updates:**
   - For updates, increment `buildNumber`
   - Build new version: `eas build --platform ios --profile production`
   - Submit: `eas submit --platform ios --profile production`

---

## 🆘 Need Help?

- **EAS Documentation:** https://docs.expo.dev/build/introduction/
- **App Store Connect Help:** https://help.apple.com/app-store-connect/
- **Apple Developer Support:** https://developer.apple.com/support/

---

## Quick Command Reference

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for App Store
cd ayuuto-mobile
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production

# Check build status
eas build:list

# View build logs
eas build:view [build-id]
```

---

**Good luck with your App Store submission! 🚀**
