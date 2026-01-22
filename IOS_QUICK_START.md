# iOS App Store Submission - Quick Start

## Prerequisites Checklist

- [ ] **Apple Developer Account** ($99/year)
  - Sign up: https://developer.apple.com/programs/
  - Required for App Store submission

- [ ] **EAS CLI installed**
  ```bash
  npm install -g eas-cli
  ```

- [ ] **Logged into Expo**
  ```bash
  eas login
  ```

---

## Step-by-Step Process

### 1. Build iOS App

```bash
cd ayuuto-mobile
eas build --platform ios --profile production
```

**First time:** EAS will ask you to set up credentials. Choose "Let EAS handle credentials" (easiest option).

**Wait:** Build takes ~15-20 minutes. You'll get a download link when done.

---

### 2. Create App in App Store Connect

1. Go to: https://appstoreconnect.apple.com
2. Login with your Apple Developer account
3. Click **"+"** → **"New App"**
4. Fill in:
   - **Platform:** iOS
   - **Name:** Ayuuto
   - **Primary Language:** English
   - **Bundle ID:** `com.technoarts.ayuuto` (must match app.json)
   - **SKU:** `ayuuto-ios` (any unique identifier)

---

### 3. Prepare App Store Listing

**Required Information:**

1. **App Name:** Ayuuto
2. **Subtitle:** (max 30 chars) e.g., "Group Savings Made Easy"
3. **Description:** (max 4000 chars) Describe your app
4. **Keywords:** (max 100 chars) e.g., "savings,group,rotating,credit,finance"
5. **Support URL:** **REQUIRED** - Your support email or website
6. **Privacy Policy URL:** **REQUIRED** - Must be publicly accessible

**Screenshots Required:**

- **iPhone 6.7"** (iPhone 14 Pro Max): 1290 x 2796 px
- **iPhone 6.5"** (iPhone 11 Pro Max): 1242 x 2688 px
- **iPhone 5.5"** (iPhone 8 Plus): 1242 x 2208 px

**How to create:**
1. Run app in iOS Simulator
2. Take screenshots: `Cmd + S`
3. Upload to App Store Connect

---

### 4. Submit App

**Option A: Via EAS (Easiest)**
```bash
eas submit --platform ios --profile production
```

**Option B: Via App Store Connect**
1. Download `.ipa` from EAS build
2. Use Xcode → Window → Organizer
3. Click "+" → Add `.ipa`
4. Click "Distribute App" → "App Store Connect"

---

### 5. Complete App Store Listing

In App Store Connect, fill in:
- App Information (name, description, keywords)
- Screenshots (all required sizes)
- Privacy Policy URL (**REQUIRED**)
- Support URL (**REQUIRED**)
- App Privacy questions
- Version Information

---

### 6. Submit for Review

1. Review all information
2. Click **"Submit for Review"**
3. Wait for review (24-48 hours typically)
4. Check status in App Store Connect

---

## Important Notes

- **Privacy Policy:** Must be publicly accessible (host on GitHub Pages, your website, etc.)
- **Support URL:** Can be an email: `mailto:support@yourdomain.com`
- **Build Number:** Increment in `app.json` for each submission (currently "1")
- **Version:** Increment in `app.json` for major updates (currently "1.0.0")

---

## Testing First (Recommended)

Before submitting to App Store, test with TestFlight:

```bash
# Build for TestFlight
eas build --platform ios --profile preview

# Submit to TestFlight
eas submit --platform ios --profile preview
```

Then add testers in App Store Connect → TestFlight.

---

## Common Issues

**"Missing Privacy Policy URL"**
→ You must host a privacy policy page (GitHub Pages is free)

**"Invalid Bundle Identifier"**
→ Ensure `com.technoarts.ayuuto` matches exactly in app.json and App Store Connect

**"Missing Screenshots"**
→ You must provide at least one screenshot for each required device size

---

## Full Guide

See `IOS_APP_STORE_SUBMISSION.md` for complete detailed instructions.
