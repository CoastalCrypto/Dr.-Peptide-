# PepTrack Pro — Product Requirements Document

## Overview
All-in-one health companion app for researching, calculating dosages, tracking usage, and monitoring health outcomes related to peptides, supplements, and prescription medications.

## Tech Stack
- **Frontend**: Expo (SDK 54) with React Native, expo-router (file-based routing), AsyncStorage (offline-first)
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **AI**: Gemini 3 Flash via Emergent LLM key (health summaries, peptide Q&A, web search)
- **Auth**: Emergent Google Auth (optional, guest mode default)
- **Charts**: Victory Native v41 with @shopify/react-native-skia
- **Security**: expo-local-authentication (biometrics), expo-secure-store (PIN)

---

## Features Implemented (MVP)

### 1. Onboarding Flow
- Legal waiver/disclaimer modal (mandatory first launch)
- 3-slide feature overview + goal selection
- "Continue as Guest" (default) / Google Auth (optional)
- Goals: Weight Loss, Recovery, Anti-Aging, Muscle Growth, General Health, Medication Management

### 2. Home Dashboard (Tab 1) — **WITH RECURRING ITEMS & INJECTION TRACKER**
- Greeting with current date
- **Adherence ring** (SVG circular progress showing % of doses taken)
- **Calendar Component**:
  - Week view: 7-day horizontal layout with date selection
  - Month view: Full calendar grid with navigation
  - Toggle between Week/Month views
  - "Today" quick navigation button
  - Marked dates showing items scheduled
- **Today's Schedule Section**:
  - Displays all doses scheduled for selected date
  - Color-coded by category (Peptide=green, Supplement=blue, Medication=red)
  - Quick actions: Take (check), More options (skip/delayed)
  - Status badges: Taken, Skipped, Delayed
- **Dose Logging Modal**:
  - Taken: Marks dose as completed
  - Skipped: With optional reason
  - Delayed: With timestamp
- **My Recurring Items** horizontal scroll section
- FAB and Add button to create new recurring items
- **Injection Site Tracker** button - opens full tracking modal

### 3. Injection Site Rotation Tracker (VERIFIED WORKING - Feb 15, 2026)
- Modal accessible from Home screen via button
- 10 injection sites: Abdomen (L/R), Thighs (L/R outer, L/R front), Arms (L/R), Glutes (L/R)
- Recommended next site algorithm (alternates left/right, respects 3-day rest)
- Site status colors: Green (available), Yellow (resting), Red (recent)
- Logging injection updates site history
- Last used date display per site
- Legend explaining status indicators

### 4. Recurring Items System
**Full recurrence scheduling with:**
- **Recurrence Types**: Daily, Weekly, Bi-weekly, Monthly, Custom (every X days)
- **Weekly/Bi-weekly**: Day-of-week selector (Sun-Sat)
- **Time of Day**: Morning, Afternoon, Evening, Bedtime (multi-select)
- **Categories**: Peptide, Supplement, Medication, Other (color-coded)
- **Advanced Options**: Notes, Reminder toggle
- **Form Fields**: Name, Dosage, Unit (mcg/mg/mL/IU/tablets/capsules), Route (Subcutaneous/Oral/Intramuscular/Nasal/Topical/Sublingual)

### 5. Peptide Reconstitution Calculator (Tab 2) — Flagship Feature
- Syringe size selector (0.3/0.5/1.0 mL + custom)
- Vial amount selector (1-50 mg + custom)
- BAC water selector (0.5-5.0 mL + custom)
- Desired dose selector (50 mcg - 15 mg + custom)
- Real-time calculation: Units to Draw, mL to Draw, Concentration, Doses Per Vial
- Animated syringe visual (Reanimated fill)
- Warning banner when dose exceeds syringe capacity
- Save/load presets (AsyncStorage)
- **Add to Schedule** button - creates recurring item from calculator

### 6. Research Database (Tab 3) — **WITH COMPARISON TOOL & AI SEARCH**
- **29 peptide profiles** covering all categories
- **20 medication profiles**
- **Custom Entry System**: Users can add their own peptides and medications
- **AI Web Search** (VERIFIED WORKING): Search for detailed peptide/medication information using Gemini 3 Flash
- **Peptide Comparison Tool** (VERIFIED WORKING - Feb 15, 2026):
  - Compare mode toggle button
  - Select 2-3 peptides via checkboxes
  - Comparison modal showing: Goals, Routes, Frequency, Dosage, Cycle, Description
  - Side-by-side attribute comparison
- Searchable + filterable by category
- Detail page with dosage ranges, side effects, protocols, storage
- "Quick Calculate" and "Add to Tracker" actions

### 7. Health Journal (Tab 4) — **WITH VICTORY NATIVE CHARTS**
- Log: Weight, Energy (1-10), Sleep quality/hours, Mood (5 emojis), Gym Activity, Notes
- **Gym Activity tracking** (8 workout types): Weights, Cardio, Yoga, Cycling, Swimming, Sports, Walking, Other
  - Duration (mins) input
  - Intensity scale (1-10)
- Recent entries timeline
- **7-Day Trend Charts** (IMPLEMENTED - Feb 15, 2026):
  - Victory Native charts for native platforms
  - Weight trend (line chart)
  - Energy level (bar chart)
  - Sleep quality (bar chart)
  - Sleep duration (line chart)
  - Mood (bar chart)
  - Gym activity (bar chart)
  - Fallback MiniBarChart for web preview
- Weight delta tracking

### 8. Profile & Settings (Tab 5)
- Guest user display / Google Auth sign-in
- **Light/Dark Mode Toggle**
- Weight unit (lbs/kg) and measurement unit (in/cm) toggles
- Notifications toggle
- **Vendor Management** - Full CRUD for vendors and orders
- Data export and clear functionality
- Delete Account button
- Medical disclaimer
- Privacy Policy and Terms of Service links

### 9. App Security (VERIFIED WORKING - Feb 15, 2026)
- **Biometric Authentication** (Face ID / Touch ID / Fingerprint)
  - Toggle in Profile > Security section
  - Uses expo-local-authentication
  - Only available on supported devices
- **PIN Lock**
  - 4-6 digit PIN setup
  - PIN stored securely via expo-secure-store
  - Set/Remove PIN functionality
  - PIN verification on app launch (when enabled)

### 10. Vendor Management (VERIFIED WORKING - Feb 15, 2026)
- **Vendors Tab**:
  - Add/Edit vendors with: name, website, email, phone, rating (1-5 stars), payment methods, domestic/international, avg shipping days, notes
  - Vendor cards with all details displayed
  - Order count per vendor
- **Orders Tab**:
  - Add/Edit orders with: vendor, order number, date, items, amount, currency, status, tracking number/URL, expected/actual delivery, notes
  - Order status indicators (pending/shipped/delivered/cancelled)
  - Items list display

---

## Backend API Endpoints

### Core APIs
- `GET /api/` — Health check
- `POST /api/auth/session` — Google Auth session exchange
- `GET /api/auth/me` — Current user
- `POST /api/auth/logout` — Logout
- `DELETE /api/auth/delete-account` — Delete account and all data

### AI APIs
- `POST /api/ai/ask` — AI peptide Q&A (GPT-5.2)
- `POST /api/ai/summary` — AI health summary (Gemini 3 Flash)
- `POST /api/ai/web-search` — AI-powered research search (Gemini 3 Flash)

### Recurring Items APIs
- `POST /api/recurring-items` — Create recurring item
- `GET /api/recurring-items` — List all active recurring items
- `GET /api/recurring-items/{item_id}` — Get single item
- `PUT /api/recurring-items/{item_id}` — Update item
- `DELETE /api/recurring-items/{item_id}` — Soft delete (mark inactive)
- `GET /api/recurring-items/schedule/{date}` — Get items scheduled for date
- `POST /api/recurring-items/dose-log` — Log a dose (upsert)
- `GET /api/recurring-items/dose-logs/{date}` — Get logs for date

### Vendor Management APIs
- `POST /api/vendors` — Create vendor
- `GET /api/vendors` — List all active vendors
- `GET /api/vendors/{vendor_id}` — Get single vendor
- `PUT /api/vendors/{vendor_id}` — Update vendor
- `DELETE /api/vendors/{vendor_id}` — Soft delete
- `GET /api/vendors/{vendor_id}/orders` — Get all orders for a vendor
- `POST /api/orders` — Create order
- `GET /api/orders` — List orders (filter by vendor_id, status)
- `GET /api/orders/{order_id}` — Get single order
- `PUT /api/orders/{order_id}` — Update order
- `DELETE /api/orders/{order_id}` — Hard delete order

### Existing CRUD APIs
- `CRUD /api/tracker/items` — Tracked items (legacy)
- `CRUD /api/tracker/doses` — Dose logs (legacy)
- `CRUD /api/journal/entries` — Journal entries
- `CRUD /api/calculator/presets` — Calculator presets
- `CRUD /api/custom/peptides` — Custom peptide entries
- `CRUD /api/custom/medications` — Custom medication entries

---

## Design System
- **Theme**: "Grungy gym" aesthetic with Permanent Marker font
- **Dark Mode Colors**: Background #0D0D0D, Surface #1A1A1A, Primary Red #FF3B30, Accent Neon Green #39FF14
- **Light Mode Colors**: Background #F5F5F7, Surface #FFFFFF, Primary Red #FF3B30, Accent Green #00A86B
- **Category Colors**: Peptide #39FF14, Supplement #00A8E8, Medication #FF6B6B, Other #9B59B6
- 48px minimum touch targets
- Large dosage typography

---

## Data Storage
- Guest mode: All data in AsyncStorage (offline-first)
- Authenticated: Optional cloud backup via MongoDB
- Storage Keys: peptrack_recurring_items, peptrack_doses, peptrack_theme_mode, etc.

---

## Completed Tasks (Feb 15, 2026)
- [x] Full app redesign ("grungy gym" theme)
- [x] Legal waiver implementation
- [x] Light/Dark mode system with ThemeContext
- [x] AI Web Search integration (Gemini 3 Flash)
- [x] Recurring Items feature with calendar
- [x] App Store Deployment Infrastructure
- [x] App Icons Updated
- [x] App Store Screenshots (7 screenshots)
- [x] Calculator Enhancements (presets, add to schedule)
- [x] **Vendor Management Feature** - Full CRUD, tested 100%
- [x] **Calculator Scroll Fix** - ScrollView scrolling on web
- [x] **Journal Gym Activity** - 8 workout types with duration/intensity
- [x] **Theme Persistence Fix for Web** - localStorage fallback
- [x] **Injection Site Tracker** - VERIFIED WORKING
- [x] **PIN/Biometric Security** - VERIFIED WORKING
- [x] **Peptide Comparison Tool** - VERIFIED WORKING (bug fixed)
- [x] **Victory Native Charts** - Implemented for Journal Trends
- [x] **Navigation Redesign** - Hamburger dropdown menu replacing bottom tabs
- [x] **Vendor Management in Navigation** - Added to dropdown menu (Feb 15, 2026)
- [x] **Workout Streak Badge** - Shows consecutive workout days on Home screen
- [x] **Navigation Header Title** - FIXED - Updates correctly when switching screens
- [x] **TypeScript Errors** - FIXED - All TSC errors resolved
- [x] **Google Authentication for Cloud Sync** - VERIFIED WORKING (Feb 15, 2026)
  - Emergent Google OAuth integration
  - AuthContext for global auth state
  - AuthCallback screen for OAuth redirect handling
  - Cloud Sync service with backup/restore/merge
  - Profile page with Cloud Sync UI section
  - Backend sync endpoints (backup, restore, status, clear)

---

## Known Limitations
- **Theme persistence on web preview**: Works within session but Playwright testing tool clears localStorage between contexts. Works correctly in actual browser usage.

---

## Upcoming Tasks
- [ ] AI-powered weekly health summaries (backend logic)
- [ ] Full-text search on local data in Research tab
- [ ] "Browse by Goal" filtering in Research tab

---

## Future/Backlog
- [ ] Push notifications for reminders (expo-notifications installed)
- [ ] Data export (CSV/PDF)
- [ ] OpenFDA API integration for live medication data
- [ ] Multi-device sync

---

## Testing Status (Feb 15, 2026)
- **Iteration 10**: Google Auth & Cloud Sync - ALL PASSED
  - Backend: 100% (15/15 auth & cloud sync tests)
  - Frontend: 100% (all UI components verified)
  - Auth session endpoint: PASSED
  - Auth me endpoint: PASSED
  - Auth logout endpoint: PASSED
  - Sync backup endpoint: PASSED
  - Sync restore endpoint: PASSED
  - Sync status endpoint: PASSED
  - Cloud Sync UI: PASSED
- **Iteration 9**: Pre-Apple App Store submission testing - ALL PASSED
  - Legal Disclaimer: PASSED
  - Onboarding: PASSED  
  - Home Calendar: PASSED
  - Peptide Calculator: PASSED
  - Research AI Search: PASSED
  - AI Content Safety: PASSED (blocks inappropriate queries)
  - Journal Logging: PASSED
  - Profile Theme: PASSED
  - Vendor Management: PASSED
  - Navigation Dropdown: PASSED
  - Backend: 100% (59/59 tests)
  - Frontend: 100% all features verified

---

## Apple App Store Readiness

### Compliance Status:
- [x] Account deletion functionality
- [x] No "beta" or "coming soon" content
- [x] No Android references
- [x] AI content safety filters implemented
- [x] Privacy Policy in-app
- [x] Terms of Service link
- [x] Contact email in privacy policy
- [x] Age rating disclosure (17+)
- [x] Medical disclaimers throughout

### Files for Submission:
- `/app/APPLE_REVIEW_GUIDE.md` - Test account guide for Apple reviewers
- `/app/frontend/assets/images/` - App icons and screenshots

### Still Needed (External):
- [ ] Landing page at peptrackpro.com
- [ ] Privacy policy hosted at yourdomain.com/privacy
- [ ] Screen recordings for complex features
- [ ] Apple Developer Account setup

---

## Preview URL
https://wellness-hub-580.preview.emergentagent.com

---

## File Structure

```
/app
├── backend/
│   └── server.py             # FastAPI with all endpoints
├── frontend/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx     # Home with Injection Tracker
│   │   │   ├── calculator.tsx
│   │   │   ├── research.tsx  # With Comparison Tool
│   │   │   ├── journal.tsx   # With Victory Charts
│   │   │   └── profile.tsx   # With Security & Vendor Management
│   │   └── ...
│   └── src/
│       ├── components/
│       │   ├── InjectionSiteTracker.tsx
│       │   ├── VendorManagement.tsx
│       │   └── ...
│       └── services/
│           ├── appLock.ts    # PIN/Biometric service
│           └── notifications.ts
```
