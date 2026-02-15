# PepTrack Pro — Google Play Store Publishing Guide

## Your Project Status

Based on my review of your repo (`conflict_140226_1616` branch, 78 commits):

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend (Expo/React Native) | ✅ Ready | Expo SDK 54, 5 tabs, all features built |
| Backend (FastAPI + MongoDB) | ✅ Ready | Needs to be deployed to a production server |
| App Icons (1024x1024) | ✅ Ready | `icon.png` and `adaptive-icon.png` present |
| Splash Screen | ✅ Ready | `splash-icon.png` present |
| Feature Graphic (1024x500) | ✅ Ready | `feature-graphic.png` present |
| Store Listing Copy | ✅ Ready | `STORE_LISTING.md` fully written |
| `app.json` Android Config | ✅ Ready | Package: `com.peptrackpro.app`, permissions set |
| `eas.json` Build Config | ⚠️ Needs Update | Project ID is placeholder, needs Expo account link |
| Screenshots | ❌ Missing | README describes 8 screenshots but no image files exist |
| Privacy Policy URL | ✅ Created | `docs/privacy-policy.html` — deploy via GitHub Pages |
| Terms of Service URL | ✅ Created | `docs/terms-of-service.html` — deploy via GitHub Pages |
| Support/Landing Page | ✅ Created | `docs/index.html` — deploy via GitHub Pages |
| Google Service Account Key | ❌ Missing | Required for automated Play Store submission |
| Backend Production URL | ❌ Missing | `EXPO_PUBLIC_BACKEND_URL` env var needs a live server |
| Main Branch | ❌ Empty | All code is on `conflict_140226_1616`, main only has README |

---

## STEP 1: Merge Your Code to Main Branch

Your `main` branch is empty — all the app code lives on `conflict_140226_1616`. Fix this first.

```bash
# On your local machine
git clone https://github.com/CoastalCrypto/Dr.-Peptide-.git
cd Dr.-Peptide-

# Merge the working branch into main
git checkout main
git merge conflict_140226_1616 --allow-unrelated-histories

# If there are merge conflicts, resolve them, then:
git add .
git commit -m "Merge complete app from conflict_140226_1616 into main"
git push origin main
```

---

## STEP 2: Set Up an Expo Account & Link the Project

EAS Build (Expo Application Services) is what compiles your Expo app into an AAB file that Google Play requires. You need an Expo account.

### 2a. Create an Expo Account
1. Go to [https://expo.dev/signup](https://expo.dev/signup)
2. Create a free account (the free tier includes 30 builds/month which is plenty)
3. Note your Expo username — you'll need it

### 2b. Install EAS CLI on Your Computer
```bash
npm install -g eas-cli
eas login
# Enter your Expo credentials
```

### 2c. Link the Project
```bash
cd Dr.-Peptide-/frontend
eas init
```

This will:
- Create a project on Expo's servers
- Generate a real `projectId` (replacing the placeholder `"peptrack-pro"`)
- Update your `app.json` automatically

### 2d. Update `app.json` Owner

After `eas init`, open `frontend/app.json` and verify these fields match your Expo account:

```json
{
  "expo": {
    "owner": "YOUR_EXPO_USERNAME",
    "extra": {
      "eas": {
        "projectId": "THE_REAL_UUID_FROM_EAS_INIT"
      }
    }
  }
}
```

---

## STEP 3: Deploy Your Backend to Production

Your app's API calls go to `process.env.EXPO_PUBLIC_BACKEND_URL`. This FastAPI server needs to be live on the internet before your app can work in production.

### Recommended: Deploy to Railway (Easiest)
1. Go to [https://railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo" → select `CoastalCrypto/Dr.-Peptide-`
3. Set the root directory to `/backend`
4. Railway auto-detects Python/FastAPI
5. Add a MongoDB database service (Railway has one-click MongoDB, or use MongoDB Atlas free tier)
6. Set environment variables in Railway:
   - `MONGODB_URI` = your MongoDB connection string
   - Any other env vars your `server.py` expects (API keys, secrets, etc.)
7. Once deployed, Railway gives you a URL like `https://drpeptide-production.up.railway.app`

### Alternative Options
- **Render.com** — Free tier available, auto-deploys from GitHub
- **Fly.io** — Good for FastAPI, generous free tier
- **Your own VPS** — If you want to host it on your existing infrastructure

### Save Your Backend URL
You'll need this URL in Step 5 when building the app. It becomes the `EXPO_PUBLIC_BACKEND_URL` environment variable.

---

## STEP 4: Create a Privacy Policy Page

Google Play **requires** a privacy policy URL. Your `STORE_LISTING.md` references `https://peptrackpro.com/privacy-policy` but that doesn't exist yet.

### Quickest Option: GitHub Pages
1. Create a new repo called `peptrackpro.com` (or use a branch of the existing repo)
2. Add an `index.html` and a `privacy-policy.html`
3. Enable GitHub Pages in repo settings
4. Your privacy policy will be at `https://coastalcrypto.github.io/peptrackpro.com/privacy-policy`

### What the Privacy Policy Must Include (for Google Play approval):
- What data you collect (health metrics, medication names, dosing schedules)
- How data is stored (locally on device, optionally backed up to cloud)
- That you do NOT sell or share personal health data with third parties
- How users can delete their data (in-app account deletion)
- Contact information (email address)
- GDPR and CCPA compliance statements
- Date of last update

### Alternative: Use a Generator
Sites like [https://app-privacy-policy-generator.nisrulz.com](https://app-privacy-policy-generator.nisrulz.com) can generate a compliant privacy policy. Host the output anywhere with a public URL.

---

## STEP 5: Build the Production AAB (Android App Bundle)

Google Play requires an AAB file (not APK). Your `eas.json` is already configured for this:

```json
"production": {
  "android": {
    "buildType": "app-bundle"
  }
}
```

### 5a. Set the Backend URL Environment Variable

Create a file at `frontend/.env` (or set it in your EAS build config):

```bash
# frontend/.env
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url-from-step-3.com
```

Or set it in `eas.json` for the production profile:

```json
"production": {
  "android": {
    "buildType": "app-bundle"
  },
  "env": {
    "EXPO_PUBLIC_BACKEND_URL": "https://your-backend-url.com"
  }
}
```

### 5b. Run the Production Build

```bash
cd frontend
eas build --platform android --profile production
```

**What happens:**
- EAS uploads your project to Expo's cloud build servers
- It compiles a release-signed AAB (Expo handles signing with a new keystore by default)
- Build takes ~10-20 minutes
- When done, you get a download link for the `.aab` file

**IMPORTANT — Signing Key:** The first time you build, EAS will ask about signing. Choose **"Let EAS manage my credentials"** — this creates a keystore that Expo stores securely. You can download it later if needed. This keystore is tied to your app forever on Google Play, so don't lose access to your Expo account.

### 5c. Download the AAB
```bash
# Or just click the download link in the terminal/Expo dashboard
eas build:list --platform android
```

Download the `.aab` file to your computer. You'll upload this to Google Play Console.

---

## STEP 6: Capture Screenshots

You have no screenshots in your repo (just the README describing them). Google Play requires **at least 2 screenshots** but you should upload all 8 described in your `screenshots/README.md`.

### How to Capture Screenshots

**Option A: From Expo Go on your phone (easiest)**
1. Run the app on your phone via Expo Go
2. Navigate to each screen
3. Take phone screenshots (power + volume down on Android)
4. Screenshots will be in your correct device resolution

**Option B: From Android Emulator**
1. Open Android Studio → Device Manager → Create a Pixel 7 emulator
2. Run your app on the emulator
3. Use the emulator's screenshot button (camera icon in toolbar)
4. This gives you clean, consistent screenshots

### Screenshots Needed (per your STORE_LISTING.md):
1. Home Screen — calendar view with today's schedule
2. Peptide Calculator — with syringe visual
3. Add Recurring Item — modal showing options
4. Research Database — with search and compound cards
5. Month Calendar View — full month grid
6. Profile/Settings — theme toggle, preferences
7. Dark Mode — home screen in dark theme
8. Health Journal — log entries with trends

### Screenshot Requirements for Google Play:
- **Minimum:** 2 screenshots, **maximum:** 8
- **Dimensions:** 16:9 or 9:16 aspect ratio, minimum 320px, maximum 3840px on any side
- **Format:** JPEG or 24-bit PNG (no alpha)
- **Recommended:** 1080 x 1920 px (phone portrait)

### Pro Tip: Add Store Frames
Use a free tool like [https://mockuphone.com](https://mockuphone.com) or [https://screenshots.pro](https://screenshots.pro) to wrap your screenshots in a device frame with marketing text above (e.g., "Precision Peptide Calculator" above the calculator screenshot). This dramatically improves conversion rates.

---

## STEP 7: Set Up Google Play Console

You said your developer account is ready. Here's how to create the app listing:

### 7a. Create the App
1. Go to [https://play.google.com/console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in:
   - **App name:** PepTrack Pro
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free (you can add in-app purchases later)
4. Accept the declarations and click **"Create app"**

### 7b. Complete the Dashboard Checklist

Google Play Console shows a setup checklist. Here's how to complete each item:

#### Store Listing (Main Store Listing)
Copy directly from your `STORE_LISTING.md`:
- **Short description** (80 char): `Track peptides, supplements & medications. Calculate doses. Monitor your health.`
- **Full description** (4000 char): Copy the full description from `STORE_LISTING.md`
- **App icon:** Upload `frontend/assets/images/icon.png` (1024x1024)
- **Feature graphic:** Upload `frontend/assets/images/feature-graphic.png` (1024x500)
- **Phone screenshots:** Upload your captured screenshots from Step 6
- **Category:** Health & Fitness
- **Tags:** Select relevant tags (Health, Fitness, Medical)

#### App Content (Content Rating, Privacy, Ads)
- **Privacy Policy:** Enter the URL from Step 4
- **Content Rating:** Start the questionnaire — for a health tracker with no violence, gambling, or user-generated content, you'll likely get **"Everyone"**
- **Ads Declaration:** Select "No, my app does not contain ads" (per your STORE_LISTING.md)
- **Data Safety:** This is critical — fill out the form:
  - **Data collected:** Health/fitness data, app activity
  - **Data shared:** None (your app doesn't share data with third parties)
  - **Data encrypted:** Yes (in transit via HTTPS)
  - **Data deletion:** Users can request deletion (in-app via Profile tab)
- **App Access:** Select "All functionality is available without special access" (since guest mode works)
- **Target Audience:** Select 18+ (health/medical content)
- **Government Apps:** No
- **Health Apps:** May trigger additional review — indicate it's a personal tracker, NOT a medical device, does NOT provide diagnoses

#### App Integrity
- Default settings are fine. Google Play will use Play App Signing.

---

## STEP 8: Upload the AAB & Create a Release

### 8a. Set Up Play App Signing
1. Go to **Setup → App signing** in Play Console
2. Choose **"Let Google manage and protect your app signing key"**
3. This is required for new apps

### 8b. Create an Internal Testing Release (Do This First)
Start with internal testing before going to production. This lets you verify everything works.

1. Go to **Testing → Internal testing**
2. Click **"Create new release"**
3. Upload the `.aab` file you downloaded in Step 5c
4. Fill in release name: `1.0.0`
5. Add release notes: `Initial release of PepTrack Pro`
6. Click **"Save"** then **"Review release"** then **"Start rollout to Internal testing"**

### 8c. Test on a Real Device
1. In Internal testing, go to the **"Testers"** tab
2. Create a testers list, add your email (and anyone else who should test)
3. Copy the opt-in link and open it on your Android phone
4. Install from the Play Store internal testing track
5. Verify everything works: calculator, research, journal, reminders, backend connectivity

### 8d. Promote to Production
Once testing confirms everything works:

1. Go to **Production → Create new release**
2. Click **"Add from library"** and select the tested AAB
3. Add release notes for users
4. Click **"Review release"**
5. Handle any warnings or errors Google flags
6. Click **"Start rollout to Production"**

---

## STEP 9: Google Play Review

After submitting to production, Google reviews your app. For a health/medical app, expect:

- **Review time:** 1-7 days (health apps sometimes take longer)
- **Common rejection reasons for health apps:**
  - Missing or inadequate medical disclaimer → yours is built into the app (waiver screen), so you should be fine
  - Privacy policy doesn't match data safety section → make sure these are consistent
  - App crashes on launch → test thoroughly in Step 8c
  - Screenshots don't match actual app experience

### If Rejected:
Google tells you exactly why. Fix the issue, rebuild if needed (`eas build` again), upload new AAB, resubmit.

---

## STEP 10: Post-Launch Checklist

- [ ] Set up Google Play Console **alerts** for crashes and ANRs
- [ ] Monitor the **Ratings & Reviews** section daily for the first two weeks
- [ ] Set up **Firebase Crashlytics** (or Sentry) for real-time crash reporting
- [ ] Plan your first update (fix any user-reported issues within 1-2 weeks)
- [ ] Consider setting up **automated submissions** with the Google Service Account key in `eas.json` so future builds can be submitted with `eas submit --platform android`

---

## Quick Reference: Key Files in Your Repo

| File | Purpose |
|------|---------|
| `frontend/app.json` | Expo config: app name, package ID, icons, permissions |
| `frontend/eas.json` | EAS Build profiles: dev, preview, production |
| `frontend/STORE_LISTING.md` | Pre-written Google Play store copy |
| `frontend/assets/images/icon.png` | App icon (1024x1024) |
| `frontend/assets/images/adaptive-icon.png` | Android adaptive icon (1024x1024) |
| `frontend/assets/images/feature-graphic.png` | Play Store feature graphic (1024x500) |
| `frontend/assets/images/splash-icon.png` | Splash/loading screen image |
| `frontend/src/utils/api.ts` | Backend URL config (needs `EXPO_PUBLIC_BACKEND_URL`) |
| `backend/server.py` | FastAPI backend (needs production deployment) |
| `backend/requirements.txt` | Python dependencies for backend |

---

## Estimated Timeline

| Step | Time |
|------|------|
| Merge branch + set up Expo/EAS | 30 minutes |
| Deploy backend | 1-2 hours |
| Create privacy policy | 30 minutes |
| Build AAB | 15-20 minutes (cloud build) |
| Capture screenshots | 30-60 minutes |
| Fill out Play Console listing | 1-2 hours |
| Internal testing | 1-2 days |
| Google review after production submit | 1-7 days |
| **Total to submission** | **~1 day of active work + review wait** |
