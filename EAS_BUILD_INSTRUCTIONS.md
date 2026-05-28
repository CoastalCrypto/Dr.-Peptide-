# PepTrack Pro — EAS Build & Resubmit Instructions

This document walks you (the user) through generating a new iOS production build with the Sign in with Apple + citations fixes (Feb 28, 2026) and resubmitting to App Store Connect.

---

## Pre-flight Checklist (verify before building)

- [x] `frontend/app.json` → `ios.bundleIdentifier` = `com.peptrackpro.app`
- [x] `frontend/app.json` → `ios.usesAppleSignIn` = `true`
- [x] `frontend/app.json` → `plugins` includes `"expo-apple-authentication"`
- [x] Backend `/api/auth/apple` is deployed and reachable from your production `EXPO_PUBLIC_BACKEND_URL`
- [x] Backend env var `APPLE_BUNDLE_ID=com.peptrackpro.app` is set in production
- [ ] **Apple Developer Portal**: App ID `com.peptrackpro.app` has the **Sign in with Apple** capability enabled
- [ ] **App Store Connect**: bump version (e.g. 1.0.0 → 1.0.1) OR bump `ios.buildNumber` from `"1"` to `"2"` before building

> Bump the build number — Apple won't accept an upload with the same build number as a previously rejected submission.

```bash
# Edit /app/frontend/app.json and change "buildNumber": "1" → "2"
```

---

## Step 1 — Install Expo CLI + EAS CLI on your local machine (one-time)

```bash
npm install -g eas-cli expo-cli
eas --version  # confirm
```

## Step 2 — Pull the latest code from your repo / Emergent → GitHub

If you haven't pushed yet, use Emergent's "Save to GitHub" feature.
Then on your local machine:

```bash
git pull origin main
cd peptrack-pro  # or wherever your repo lives
cd frontend
```

## Step 3 — Log into EAS

```bash
eas login        # use your Expo account credentials
eas whoami       # confirm you're logged in
```

## Step 4 — Configure / verify EAS

If you've never built before:

```bash
eas build:configure --platform ios
```

This creates/updates `eas.json`. The default `production` profile is what we want.

## Step 5 — Build for iOS

```bash
eas build --platform ios --profile production
```

EAS will:
1. Ask for your Apple Developer credentials (or use stored ones).
2. Auto-manage your provisioning profile + distribution certificate.
3. Confirm the **Sign in with Apple** capability is on the App ID (it should already be).
4. Run the build remotely on EAS servers (10–25 min).

When complete, you'll get a `.ipa` URL.

## Step 6 — Submit to App Store Connect

```bash
eas submit --platform ios --profile production
```

This auto-uploads the build to App Store Connect. Alternatively, download the `.ipa` from EAS and upload via Transporter.app.

## Step 7 — Configure the new build in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Open your PepTrack Pro app → **iOS App** → **+ Version or Platform** (if needed, add a new version like 1.0.1).
3. Select the new build (it may take 10–30 min for "Processing").
4. **App Review Information**:
   - Sign-in required: **Yes**
   - Demo Account: provide either Google demo creds or skip if Apple sign-in is now the primary
   - **Support URL**: `https://github.com/CoastalCrypto/Dr.-Peptide-`
     *(Apple previously flagged this URL — if it still gets rejected, switch to `mailto:support@peptrackpro.com` or set up a dedicated support page.)*
   - **Notes for the reviewer**:
     ```
     iPad Sign in with Apple is now fully wired up server-side:
     1. Tap "Sign in with Apple" on the Profile tab.
     2. Use any Apple ID — the app sends the identity token to our backend.
     3. Our backend verifies the token against Apple's JWKS, creates/looks up
        the user, and issues a session token.
     4. The Profile tab updates to show the signed-in user's name + email and
        Cloud Sync becomes available.

     Citations: Tap any peptide in the Research tab → "View Sources & Citations"
     button now opens a modal listing PubMed, FDA, NIH, etc. as info sources.
     ```
5. Click **Submit for Review**.

---

## Smoke Test on Device (before submitting if you have time)

Install the production build via TestFlight on **iPad** (not just iPhone):

1. Open PepTrack Pro on iPad.
2. Go to Profile tab.
3. Tap **Sign in with Apple**.
4. Use Face ID/Touch ID / passcode to confirm.
5. **Expected**: Profile screen shows your Apple ID name + email, "Sign Out" button replaces auth buttons, Cloud Sync section appears.
6. Force-quit and re-open → still signed in.
7. Tap any peptide in Research → scroll down → tap **"View Sources & Citations"** → modal opens with PubMed/FDA/NIH references.

If all 7 steps succeed, you're good to submit.

---

## What Changed in This Build (for your reference)

### Backend (`/app/backend/server.py`)
- **NEW**: `POST /api/auth/apple` endpoint that verifies Apple identity tokens server-side
- **NEW**: Apple JWKS verification with audience + issuer + signature + expiry checks
- User upsert by `apple_sub` (stable Apple user ID)
- Returns `session_token` in both cookie and response body

### Backend env (`/app/backend/.env`)
- Added `APPLE_BUNDLE_ID=com.peptrackpro.app`

### Frontend
- `src/context/AuthContext.tsx`: added `loginWithApple()` method
- `app/(tabs)/profile.tsx`: `handleAppleAuth` now calls `loginWithApple` (was a placeholder before)
- `src/utils/api.ts`: native platforms now attach `Authorization: Bearer <session_token>` automatically
- `app/peptide/[id].tsx`: added **View Sources & Citations** button + medical disclaimer

### Tests
- `backend/tests/test_apple_auth.py` — 5 unit tests, all pass (mocked JWKS)
- `backend/tests/test_apple_auth_curl.py` — 14 regression tests (testing agent), all pass

---

## Troubleshooting

### "Invalid Apple sign-in audience" 401 error
Your `APPLE_BUNDLE_ID` env var on the backend doesn't match the iOS bundle identifier. Confirm they're identical (case-sensitive): `com.peptrackpro.app`.

### "Unable to verify Apple sign-in" 401 error
Network issue reaching `https://appleid.apple.com/auth/keys`. Make sure your production server can reach Apple's JWKS endpoint.

### Sign in with Apple button doesn't appear in TestFlight
Confirm `usesAppleSignIn: true` in `app.json` and the Sign in with Apple capability is enabled on your App ID in the Apple Developer portal.

### iPad reviewer still says "did not result in signing in"
1. Check the backend logs for the actual error.
2. Confirm `EXPO_PUBLIC_BACKEND_URL` in production points to a deployed instance with the new `/api/auth/apple` endpoint.
3. Confirm the deployed backend has `APPLE_BUNDLE_ID` env var set.
4. Confirm CORS is permissive enough for the in-app webview (it is — `allow_origins=["*"]`).
