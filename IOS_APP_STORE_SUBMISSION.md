# iOS App Store Submission Guide

## Prerequisites

### 1. Apple Developer Account
- **Required:** Apple Developer Program membership ($99/year)
- Sign up at: https://developer.apple.com/programs/
- You'll need this to:
  - Create App Store listings
  - Generate certificates and provisioning profiles
  - Submit apps for review

### 2. Install EAS CLI
```bash
npm install -g eas-cli
```

### 3. Login to Expo
```bash
eas login
```

---

## Step 1: Configure iOS Settings in app.json

Your `app.json` needs additional iOS configuration. Update it with:

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.technoarts.ayuuto",
      "buildNumber": "1",
      "infoPlist": {
        "NSUserTrackingUsageDescription": "This app uses tracking to provide personalized experiences.",
        "NSPhotoLibraryUsageDescription": "This app needs access to your photo library to share images.",
        "NSCameraUsageDescription": "This app needs access to your camera to take photos."
      },
      "config": {
        "usesNonExemptEncryption": false
      }
    }
  }
}
```

**Important Fields:**
- `bundleIdentifier`: Must be unique (already set: `com.technoarts.ayuuto`)
- `buildNumber`: Increment this for each App Store submission (start with "1")
- `infoPlist`: Privacy descriptions required by Apple

---

## Step 2: Update EAS Configuration

Update `eas.json` to include iOS build profiles:

```json
{
  "build": {
    "production": {
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

---

## Step 3: Build iOS App for App Store

### Option A: Build with EAS (Recommended)

```bash
cd ayuuto-mobile
eas build --platform ios --profile production
```

**What happens:**
1. EAS will ask you to set up credentials (first time only)
2. Choose "Let EAS handle credentials" (easiest option)
3. Build runs in the cloud (~15-20 minutes)
4. You'll get a download link for the `.ipa` file

### Option B: Build Locally (Advanced)

```bash
eas build --platform ios --profile production --local
```

**Requirements:**
- macOS with Xcode installed
- Apple Developer account configured in Xcode

---

## Step 4: Create App in App Store Connect

1. **Go to App Store Connect:**
   - https://appstoreconnect.apple.com
   - Login with your Apple Developer account

2. **Create New App:**
   - Click "+" → "New App"
   - Fill in:
     - **Platform:** iOS
     - **Name:** Ayuuto
     - **Primary Language:** English (or your preferred language)
     - **Bundle ID:** `com.technoarts.ayuuto` (must match app.json)
     - **SKU:** `ayuuto-ios` (any unique identifier)
     - **User Access:** Full Access (or Limited Access if you have a team)

3. **App Information:**
   - **Category:** Finance (or appropriate category)
   - **Subcategory:** Budgeting/Personal Finance
   - **Privacy Policy URL:** (Required - you need to host this)
   - **Support URL:** (Required - your support website/email)

---

## Step 5: Prepare App Store Listing

### Required Information:

1. **App Name:** Ayuuto (max 30 characters)
2. **Subtitle:** Brief description (max 30 characters)
   - Example: "Group Savings Made Easy"
3. **Description:** Full app description (max 4000 characters)
   - Explain what your app does
   - Highlight key features
   - Include screenshots descriptions
4. **Keywords:** Search keywords (max 100 characters, comma-separated)
   - Example: "savings,group,rotating,credit,finance"
5. **Support URL:** Your website or support email
6. **Marketing URL:** (Optional) Your app's marketing website
7. **Privacy Policy URL:** **REQUIRED** - Must be a publicly accessible URL

### Screenshots Required:

**iPhone 6.7" Display (iPhone 14 Pro Max, etc.):**
- At least 1 screenshot (up to 10)
- Resolution: 1290 x 2796 pixels
- Format: PNG or JPEG

**iPhone 6.5" Display (iPhone 11 Pro Max, etc.):**
- At least 1 screenshot (up to 10)
- Resolution: 1242 x 2688 pixels

**iPhone 5.5" Display (iPhone 8 Plus, etc.):**
- At least 1 screenshot (up to 10)
- Resolution: 1242 x 2208 pixels

**iPad Pro (12.9-inch):**
- Optional but recommended
- Resolution: 2048 x 2732 pixels

**How to Create Screenshots:**
1. Run your app in iOS Simulator
2. Take screenshots: `Cmd + S` in Simulator
3. Or use a tool like [Fastlane Frameit](https://docs.fastlane.tools/actions/frameit/) to add device frames

### App Icon:

- **Size:** 1024 x 1024 pixels
- **Format:** PNG (no transparency)
- **Location:** Already configured in `app.json` → `icon: "./assets/images/icon.png"`

---

## Step 6: Submit App for Review

### Option A: Submit via EAS (Easiest)

```bash
cd ayuuto-mobile
eas submit --platform ios --profile production
```

**What happens:**
1. EAS uploads your `.ipa` file
2. Submits to App Store Connect
3. App appears in "Waiting for Review" status

### Option B: Submit via App Store Connect

1. **Download the `.ipa` file** from EAS build
2. **Use Transporter app** (macOS) or **Xcode:**
   - Open Xcode → Window → Organizer
   - Click "+" → Add your `.ipa` file
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow the wizard

### Option C: Submit via App Store Connect Web

1. Go to App Store Connect
2. Select your app
3. Go to "TestFlight" tab
4. Upload build (if using TestFlight first)
5. Or go to "App Store" tab → "Prepare for Submission"

---

## Step 7: Complete App Store Listing

In App Store Connect, fill in:

1. **App Information:**
   - Name, subtitle, description
   - Keywords
   - Support URL
   - Marketing URL (optional)
   - Privacy Policy URL (**REQUIRED**)

2. **Pricing and Availability:**
   - Price: Free or Paid
   - Availability: Select countries

3. **App Privacy:**
   - Answer privacy questions
   - Declare data collection practices
   - Link to privacy policy

4. **Version Information:**
   - What's New in This Version
   - Screenshots (all required sizes)
   - App Preview (optional video)

5. **App Review Information:**
   - Contact information
   - Demo account (if app requires login)
   - Notes for reviewer

---

## Step 8: Submit for Review

1. **Review all information** in App Store Connect
2. **Click "Submit for Review"**
3. **Wait for review** (typically 24-48 hours)
4. **Check status** in App Store Connect

---

## Common Issues and Solutions

### Issue: "Missing Privacy Policy URL"
**Solution:** You must host a privacy policy page. Options:
- GitHub Pages (free)
- Your own website
- Privacy policy generators

### Issue: "Invalid Bundle Identifier"
**Solution:** Ensure `bundleIdentifier` in `app.json` matches App Store Connect exactly.

### Issue: "Missing Compliance Information"
**Solution:** In App Store Connect → App Privacy, answer all questions about data collection.

### Issue: "Export Compliance"
**Solution:** If your app uses encryption, you may need to provide export compliance information. Most apps can select "No" if they only use standard encryption.

### Issue: "Missing Screenshots"
**Solution:** You must provide at least one screenshot for each required device size.

---

## Testing Before Submission

### TestFlight (Recommended)

1. **Build for TestFlight:**
   ```bash
   eas build --platform ios --profile preview
   ```

2. **Submit to TestFlight:**
   ```bash
   eas submit --platform ios --profile preview
   ```

3. **Add Testers:**
   - Go to App Store Connect → TestFlight
   - Add internal testers (up to 100)
   - Add external testers (requires Beta App Review)

4. **Test on real devices** before submitting to App Store

---

## Post-Submission

1. **Monitor Review Status:**
   - App Store Connect → App Store → App Review
   - You'll receive email notifications

2. **Respond to Rejections:**
   - If rejected, read the feedback
   - Fix issues and resubmit
   - You can appeal if you disagree

3. **After Approval:**
   - App goes live automatically (if you selected "Automatically release")
   - Or manually release when ready
   - Monitor user reviews and ratings

---

## Important Notes

- **App Review Time:** Typically 24-48 hours, can take up to 7 days
- **Version Updates:** Increment `buildNumber` in `app.json` for each submission
- **Version Number:** Increment `version` in `app.json` for major updates (e.g., "1.0.0" → "1.1.0")
- **Privacy Policy:** Must be publicly accessible and comprehensive
- **Support:** Apple requires a support URL (can be an email: `mailto:support@yourdomain.com`)

---

## Quick Checklist

- [ ] Apple Developer Account ($99/year)
- [ ] EAS CLI installed and logged in
- [ ] `app.json` iOS configuration complete
- [ ] `eas.json` iOS build profile configured
- [ ] App built with `eas build --platform ios`
- [ ] App created in App Store Connect
- [ ] App Store listing information filled
- [ ] Screenshots uploaded (all required sizes)
- [ ] Privacy Policy URL provided
- [ ] Support URL provided
- [ ] App submitted for review
- [ ] TestFlight testing completed (recommended)

---

## Resources

- **Expo EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **App Store Connect Help:** https://help.apple.com/app-store-connect/
- **Apple Developer Portal:** https://developer.apple.com/
- **App Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/

---

## Need Help?

- **Expo Discord:** https://chat.expo.dev/
- **Expo Forums:** https://forums.expo.dev/
- **Apple Developer Support:** https://developer.apple.com/support/
