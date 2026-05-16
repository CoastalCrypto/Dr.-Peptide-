# PepTrack Pro - App Store Submission Checklist

## ✅ COMPLETED REQUIREMENTS

### Code & Build Configuration
- [x] **Expo SDK 54** - Latest stable version
- [x] **app.json configured** - Package ID, bundle ID, permissions set
- [x] **iOS Privacy Manifest** - Required API declarations in place
- [x] **Android permissions** - Notifications, exact alarms declared
- [x] **App icons** - 1024x1024 icon.png and adaptive-icon.png ready
- [x] **Splash screen** - splash-icon.png configured
- [x] **Feature graphic** - 1024x500 feature-graphic.png ready

### App Content
- [x] **Legal disclaimer** - Mandatory waiver on first launch
- [x] **Privacy policy** - In-app screen at `/privacy-policy`
- [x] **Medical disclaimer** - Clear "not medical advice" messaging
- [x] **Age gate** - Content rating appropriate for 17+/18+
- [x] **Content moderation** - AI queries filtered for inappropriate content
- [x] **Account deletion** - Available in Profile screen

### Security Features
- [x] **PIN code lock** - Implemented with LockScreen component
- [x] **Biometric auth** - Face ID/Touch ID support via expo-local-authentication
- [x] **Secure storage** - expo-secure-store for sensitive data
- [x] **HTTPS** - All API calls use encrypted transport
- [x] **Data encryption** - In-transit encryption enabled

### Documentation
- [x] **APPLE_REVIEW_GUIDE.md** - Complete testing instructions
- [x] **PLAY_CONSOLE_CHEATSHEET.md** - Form answers ready
- [x] **PUBLISHING_GUIDE.md** - Step-by-step deployment guide
- [x] **STORE_LISTING.md** - App store copy ready
- [x] **Privacy Policy** - Hosted and accessible

---

## 📱 iOS APP STORE (Apple)

### App Store Connect Requirements

| Requirement | Status | Notes |
|------------|--------|-------|
| Bundle ID | ✅ | `com.peptrackpro.app` |
| App Name | ✅ | PepTrack Pro |
| Privacy Policy URL | ✅ | `https://coastalcrypto.github.io/Dr.-Peptide-/privacy-policy.html` |
| App Icon (1024x1024) | ✅ | `icon.png` ready |
| Screenshots | ⚠️ | Need to capture from device |
| Age Rating | ✅ | 17+ (Medical/Health) |
| Privacy Manifest | ✅ | Configured in app.json |
| Non-Exempt Encryption | ✅ | `ITSAppUsesNonExemptEncryption: false` |

### iOS-Specific Compliance

| Item | Status | Location |
|------|--------|----------|
| NSHealthShareUsageDescription | ✅ | app.json > ios > infoPlist |
| NSHealthUpdateUsageDescription | ✅ | app.json > ios > infoPlist |
| Privacy Collected Data Types | ✅ | app.json > ios > privacyManifests |
| NSPrivacyTracking | ✅ | Set to `false` |

### Review Team Instructions
```
1. Launch app
2. Accept legal disclaimer (required checkbox)
3. Skip or complete onboarding
4. All 5 tabs are fully functional without login
5. Optional: Sign in with Google for cloud sync testing
   - Email: peptrackreviewer@gmail.com
   - Password: ReviewPepTrack2024!
```

---

## 🤖 GOOGLE PLAY STORE (Android)

### Play Console Requirements

| Requirement | Status | Notes |
|------------|--------|-------|
| Package Name | ✅ | `com.peptrackpro.app` |
| Target SDK | ✅ | SDK 35 (via Expo SDK 54) |
| Privacy Policy URL | ✅ | Required for health apps |
| Feature Graphic (1024x500) | ✅ | `feature-graphic.png` ready |
| App Icon (512x512) | ✅ | Scaled from 1024x1024 |
| Screenshots | ⚠️ | Need to capture from device |
| Content Rating | ✅ | Complete questionnaire per cheatsheet |
| Data Safety | ✅ | Form answers in cheatsheet |

### Android Permissions Declared

```json
"permissions": [
  "RECEIVE_BOOT_COMPLETED",  // For scheduled notifications
  "VIBRATE",                 // For notification feedback
  "SCHEDULE_EXACT_ALARM",    // For precise reminders
  "POST_NOTIFICATIONS"       // For push notifications (Android 13+)
]
```

### Data Safety Form Summary

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Name/Email | Optional (Google Sign-In) | No | Account management |
| Health Info | Yes | No | App functionality |
| Medications | Yes | No | App functionality |
| App Activity | Yes | No | Analytics |
| Crash Logs | Yes | No | App stability |

### Content Rating Questionnaire

| Question | Answer |
|----------|--------|
| Violence | No |
| Sexual Content | No |
| Profanity | No |
| Controlled Substances | Yes (Educational/Informational) |
| Gambling | No |
| User-Generated Content | No |
| User Interaction | No |
| Location Sharing | No |
| Digital Purchases | No |
| Ads | No |

**Expected Rating:** Teen or Mature 17+ (due to health/medication content)

---

## 📸 SCREENSHOTS NEEDED

Capture these from a real device or emulator:

### Required Screenshots (Both Platforms)
1. **Home Screen** - Calendar with Today's Schedule
2. **Calculator** - Syringe with dosage calculation
3. **Research Tab** - Peptide database with search
4. **Journal** - Health logging with trend charts
5. **Profile** - Settings with theme toggle
6. **Dark Mode** - Any screen in dark theme

### Recommended Dimensions
- **iOS:** 1290 x 2796 (iPhone 15 Pro Max)
- **Android:** 1080 x 1920 (Standard phone)

### Capture Commands
```bash
# Using Expo on device
npx expo start
# Open on phone, navigate to each screen, take screenshot

# Using Android emulator
npx expo start --android
# Use emulator screenshot button
```

---

## 🚀 BUILD & SUBMIT COMMANDS

### iOS Build
```bash
cd frontend
eas build --platform ios --profile production
eas submit --platform ios
```

### Android Build
```bash
cd frontend
eas build --platform android --profile production
eas submit --platform android
```

### Pre-Build Checklist
- [ ] Backend deployed to production URL
- [ ] `EXPO_PUBLIC_BACKEND_URL` set in eas.json production profile
- [ ] EAS account linked (`eas init`)
- [ ] Privacy policy URL is live and accessible

---

## 📋 FINAL PRE-SUBMISSION CHECKLIST

### Both Platforms
- [ ] App launches without crash
- [ ] All 5 tabs functional
- [ ] Calculator produces correct results
- [ ] AI search works and filters inappropriate content
- [ ] Journal entries save and display charts
- [ ] Notifications can be scheduled
- [ ] PIN lock works (set, verify, remove)
- [ ] Theme toggle works
- [ ] Privacy policy accessible
- [ ] Account deletion option available

### iOS Specific
- [ ] Face ID/Touch ID prompt appears
- [ ] Deep links work (`peptrackpro://`)
- [ ] No crash on orientation change

### Android Specific
- [ ] Back button behavior correct
- [ ] Notification permissions prompt on Android 13+
- [ ] App works on Android 8+ (API 26+)

---

## 📞 SUPPORT INFORMATION

| Field | Value |
|-------|-------|
| Support Email | support@peptrackpro.com |
| Website | https://coastalcrypto.github.io/Dr.-Peptide-/ |
| Privacy Policy | https://coastalcrypto.github.io/Dr.-Peptide-/privacy-policy.html |
| Terms of Service | https://coastalcrypto.github.io/Dr.-Peptide-/terms-of-service.html |

---

## ⏱️ ESTIMATED TIMELINE

| Task | Time |
|------|------|
| Capture screenshots | 30-60 min |
| Build AAB/IPA | 15-20 min each |
| Fill store listings | 1-2 hours |
| Submit for review | 10 min |
| **Review time (Apple)** | 1-3 days |
| **Review time (Google)** | 1-7 days |

---

*Last updated: May 2026*
