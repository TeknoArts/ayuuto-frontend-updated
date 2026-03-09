# Upload Ayuuto App to Google Play Console – Step-by-Step Guide

## Prerequisites

- [ ] **Google Play Developer account** ($25 one-time)  
  - Sign up: https://play.google.com/console/signup  
  - Approval can take up to 24–48 hours  

- [ ] **EAS CLI installed**
  ```bash
  npm install -g eas-cli
  ```

- [ ] **Logged into Expo**
  ```bash
  eas login
  ```

- [ ] **Privacy policy URL** (required for Play Store)  
  - Must be publicly accessible (e.g. your website or GitHub Pages).

---

## Step 1: Build the Android App Bundle (AAB)

Google Play requires an **Android App Bundle** (.aab), not APK. Your `eas.json` is set to build AAB for production.

### 1.1 Go to the project folder
```bash
cd /Users/talhasmac/Documents/Ayuuto-copy/ayuuto-mobile
```

### 1.2 Build for production (AAB)
```bash
eas build --platform android --profile production
```

- First time: EAS may ask to create/use a keystore. Choose **“Let EAS manage credentials”** so EAS creates and stores the keystore.
- Build runs in the cloud (~10–20 minutes).
- When it finishes, you get a link to download the `.aab` (or you can submit it with EAS later).

---

## Step 2: Create the app in Play Console

1. Open **Google Play Console**: https://play.google.com/console  
2. Click **“Create app”**.  
3. Fill in:
   - **App name:** Ayuuto  
   - **Default language:** e.g. English (United States)  
   - **App or game:** App  
   - **Free or paid:** Free (or Paid if you charge)  
4. Accept the declarations and create the app.

---

## Step 3: Complete “Set up your app”

In the left menu, complete the required sections. Many are under **“Policy and apps”** or the main dashboard.

### 3.1 Store listing (required)

- **App name:** Ayuuto  
- **Short description:** Up to 80 characters.  
- **Full description:** Up to 4000 characters (what the app does, features).  
- **App icon:** 512 x 512 px PNG (no transparency).  
- **Feature graphic:** 1024 x 500 px (optional but recommended).  
- **Screenshots:** At least 2 phone screenshots (e.g. 16:9 or 9:16).  
- **Privacy policy URL:** Your public privacy policy link (required).

### 3.2 Content rating

- In **“Policy” → “App content”**, open **“Content rating”**.  
- Start questionnaire, choose “Utilities” or the category that fits.  
- Answer the questions and submit.  
- Download the rating and upload it in Play Console when asked.

### 3.3 Target audience and content

- **Target audience:** Select age groups (e.g. 18+ or 13+ depending on your app).  
- **News app:** No (unless it is).  
- **COVID-19 apps:** No (unless it is).  
- **Data safety:** Declare what data you collect (e.g. email, optional analytics). Fill the form and save.

### 3.4 Ads (if applicable)

- If the app shows ads: declare it and complete the ads section.  
- If no ads: select “No, my app does not contain ads”.

### 3.5 App access

- If all features are available after install: “All functionality is available without special access.”  
- If you have login or restricted access: provide test credentials or instructions.

---

## Step 4: Upload the AAB and release

### Option A: Upload from Play Console (manual)

1. In Play Console, open your app.  
2. Go to **“Release” → “Production”** (or “Testing” first if you prefer).  
3. Click **“Create new release”**.  
4. Upload the `.aab` you downloaded from EAS.  
5. Add **Release name** (e.g. “1.0.1 (3)”) and **Release notes** (what’s new).  
6. Click **“Save”** then **“Review release”**.  
7. Fix any errors (e.g. missing store listing or policy).  
8. Click **“Start rollout to Production”** (or to a testing track first).

### Option B: Submit with EAS Submit (after build)

1. After the build finishes, run:
   ```bash
   eas submit --platform android --profile production
   ```
2. Choose the latest Android build when prompted.  
3. First time: you need **Play Console API** and a **service account** (see below).  
4. EAS will upload the AAB to the track you configured (e.g. internal testing or production).

---

## Step 5: Play Console API (for EAS Submit)

To use `eas submit`, Google Play needs API access:

1. In **Play Console** → **Setup** → **API access**.  
2. Link or create a **Google Cloud project**.  
3. Create a **service account** in Google Cloud with access to the Play Android Developer API.  
4. In Play Console → **Users and permissions**, invite the service account and give it at least **“Release to production, exclude devices, and use Play App Signing”** (or the permissions you need).  
5. Download the **JSON key** for the service account.  
6. Run:
   ```bash
   eas credentials
   ```
   and add the Android credentials; when asked for Google Service Account Key, upload the JSON file.  
7. Then run:
   ```bash
   eas submit --platform android --profile production
   ```
   and select the build and track.

---

## Version codes for future updates

- In `app.json`, **android.versionCode** must increase for each Play Store upload (e.g. 3 → 4 → 5).  
- **version** (e.g. `1.0.1`) is the user-facing version; you can change it when you want (e.g. `1.0.2`).

Example for next release:
```json
"version": "1.0.2",
"android": {
  "versionCode": 4,
  ...
}
```

Then build again:
```bash
eas build --platform android --profile production
```
and upload the new AAB to a new release in Play Console.

---

## Quick checklist before first production release

- [ ] Google Play Developer account approved  
- [ ] App created in Play Console  
- [ ] Store listing (short + full description, icon, screenshots, privacy policy URL)  
- [ ] Content rating completed  
- [ ] Data safety form completed  
- [ ] AAB built with `eas build --platform android --profile production`  
- [ ] AAB uploaded to a release (manual or via `eas submit`)  
- [ ] Release rolled out to production (or to testing first)

---

## Useful links

- **Play Console:** https://play.google.com/console  
- **EAS Build:** https://docs.expo.dev/build/introduction/  
- **EAS Submit:** https://docs.expo.dev/submit/introduction/  
- **Android app bundle:** https://developer.android.com/guide/app-bundle  
