# PepTrack Pro - Apple App Store Review Guide

## App Overview
PepTrack Pro is a health companion app for tracking peptides, supplements, and medications. It provides dosage calculations, health journaling, and research information.

---

## Test Account Credentials

### Option 1: Guest Mode (Recommended for Testing)
**No login required.** The app works fully in guest mode with all features available.

1. Launch the app
2. Accept the Legal Disclaimer (check the checkbox, tap "Continue to PepTrack Pro")
3. Complete or skip the onboarding slides
4. All features are now accessible

### Option 2: Google Sign-In (Optional)
For testing cloud sync features:
- **Email**: peptrackreviewer@gmail.com
- **Password**: ReviewPepTrack2024!

*Note: Google Sign-In is optional and only enables cloud backup. All core features work without signing in.*

---

## Feature Testing Guide

### 1. Home Screen (Tab 1)
**Test Steps:**
1. View Today's Schedule with sample items (BPC-157 doses shown)
2. Tap the calendar to switch between Week/Month views
3. Tap "Add" button to create a new recurring item
4. Test the Injection Site Tracker button

**Expected Results:**
- Calendar displays correctly with date selection
- Adherence ring shows percentage of completed doses
- Items can be added and marked as taken/skipped

---

### 2. Peptide Calculator (Tab 2)
**Test Steps:**
1. Select syringe size (0.3 mL, 0.5 mL, or 1.0 mL)
2. Select vial amount (e.g., 10 mg)
3. Select BAC water amount (e.g., 2 mL)
4. Select desired dose (e.g., 250 mcg)
5. View the calculated "Draw To" units

**Expected Results:**
- Real-time calculation updates
- Animated syringe visual shows fill level
- Save/Load presets functionality works

---

### 3. Research Tab (Tab 3)
**Test Steps:**
1. Browse the 29 peptide profiles and 20 medication profiles
2. Use the search bar to find specific items
3. Tap "AI Web Search" and search for "BPC-157 benefits"
4. Tap "Compare Peptides" to compare 2-3 peptides

**Expected Results:**
- Search returns relevant results
- AI provides educational health information
- Comparison modal shows side-by-side details

**AI Safety Test:**
Try searching for inappropriate content (e.g., "how to make drugs"). The app should display: "This query contains content that violates our guidelines."

---

### 4. Health Journal (Tab 4)
**Test Steps:**
1. Tap "Log Today" button
2. Enter weight, energy level, sleep quality
3. Select a mood emoji
4. Select gym activity type (e.g., Weights) and duration
5. Save the entry
6. Switch to "Trends" tab to view charts

**Expected Results:**
- Entry saves successfully
- Charts display trend data over time
- Gym activity shows with duration

---

### 5. Profile & Settings (Tab 5)
**Test Steps:**
1. Toggle between Light/Dark theme
2. Change weight unit (lbs/kg)
3. Test "Vendor Management" feature
4. View Privacy Policy and Terms of Service
5. Test "Delete Account" (creates confirmation dialog)

**Expected Results:**
- Theme changes immediately
- Vendor management allows adding/editing vendors
- Account deletion shows confirmation warning

---

### 6. App Security
**Test Steps:**
1. Go to Profile > Security section
2. Enable PIN Lock and set a 4-6 digit PIN
3. Close and reopen app - PIN prompt should appear
4. Test Biometric toggle (if device supports Face ID/Touch ID)

**Expected Results:**
- PIN can be set and verified
- Biometric prompt appears on supported devices

---

### 7. Injection Site Tracker
**Test Steps:**
1. From Home screen, tap "Injection Site Tracker" button
2. View the 10 injection sites with color-coded status
3. Tap a site to log an injection
4. Note the "Recommended Next Site" suggestion

**Expected Results:**
- Sites show Green (available), Yellow (resting), Red (recent)
- Logging updates the site history
- Algorithm suggests alternating left/right sites

---

## Content Safety Verification

The app includes AI-powered features with content moderation:

1. **Input Filtering**: User queries are validated before processing
2. **System Prompts**: AI is instructed to only discuss health topics
3. **Blocked Categories**: Explicit content, illegal activities, self-harm
4. **Redirect Response**: Off-topic queries receive a polite redirect message

Test by searching for inappropriate content in the Research tab - the app will respond with a content policy message rather than generating harmful content.

---

## Age Rating Justification

**Recommended Rating: 17+**

Reasons:
- Medical/health content (dosage calculations)
- Injection-related information
- User-generated health data

The app includes appropriate disclaimers that this is for educational purposes only and users should consult healthcare professionals.

---

## Privacy & Data Handling

- **Default Mode**: All data stored locally on device (offline-first)
- **Optional Cloud Sync**: Only with explicit Google Sign-In
- **No Tracking**: No advertising, no analytics tracking
- **Data Export**: Users can export their data
- **Account Deletion**: Full data deletion available in Profile

---

## Known Limitations

1. Push notifications require device permissions
2. Biometric auth only available on supported devices
3. Some charts may display differently on web vs native

---

## Support Contact

For any questions during review:
- **Email**: support@peptrackpro.com
- **Response Time**: Within 24 hours

---

## Quick Test Checklist

- [ ] App launches without crash
- [ ] Legal disclaimer displays on first launch
- [ ] Navigation between all 5 tabs works
- [ ] Calculator produces accurate results
- [ ] AI search returns appropriate content
- [ ] AI blocks inappropriate queries
- [ ] Journal entries save and display
- [ ] Theme toggle works (Light/Dark)
- [ ] Privacy Policy accessible
- [ ] Account deletion option available
