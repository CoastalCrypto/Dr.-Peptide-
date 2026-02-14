# PepTrack Pro — Product Requirements Document

## Overview
All-in-one health companion app for researching, calculating dosages, tracking usage, and monitoring health outcomes related to peptides, supplements, and prescription medications.

## Tech Stack
- **Frontend**: Expo (SDK 54) with React Native, expo-router (file-based routing), AsyncStorage (offline-first)
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **AI**: GPT-5.2 via Emergent LLM key (health summaries, peptide Q&A, web search)
- **Auth**: Emergent Google Auth (optional, guest mode default)

---

## Features Implemented (MVP)

### 1. Onboarding Flow
- Legal waiver/disclaimer modal (mandatory first launch)
- 3-slide feature overview + goal selection
- "Continue as Guest" (default) / Google Auth (optional)
- Goals: Weight Loss, Recovery, Anti-Aging, Muscle Growth, General Health, Medication Management

### 2. Home Dashboard (Tab 1) — **ENHANCED WITH RECURRING ITEMS**
- Greeting with current date
- **Adherence ring** (SVG circular progress showing % of doses taken)
- **Calendar Component** (NEW):
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

### 3. Recurring Items System (NEW - Feb 2026)
**Full recurrence scheduling with:**
- **Recurrence Types**: Daily, Weekly, Bi-weekly, Monthly, Custom (every X days)
- **Weekly/Bi-weekly**: Day-of-week selector (Sun-Sat)
- **Time of Day**: Morning, Afternoon, Evening, Bedtime (multi-select)
- **Categories**: Peptide, Supplement, Medication, Other (color-coded)
- **Advanced Options**: Notes, Reminder toggle
- **Form Fields**: Name, Dosage, Unit (mcg/mg/mL/IU/tablets/capsules), Route (Subcutaneous/Oral/Intramuscular/Nasal/Topical/Sublingual)

### 4. Peptide Reconstitution Calculator (Tab 2) — Flagship Feature
- Syringe size selector (0.3/0.5/1.0 mL + custom)
- Vial amount selector (1-50 mg + custom)
- BAC water selector (0.5-5.0 mL + custom)
- Desired dose selector (50 mcg - 15 mg + custom)
- Real-time calculation: Units to Draw, mL to Draw, Concentration, Doses Per Vial
- Animated syringe visual (Reanimated fill)
- Warning banner when dose exceeds syringe capacity
- Save/load presets (AsyncStorage)

### 5. Research Database (Tab 3)
- **29 peptide profiles** covering all categories
- **20 medication profiles**
- **Custom Entry System**: Users can add their own peptides and medications
- **AI Web Search** (NEW): Search for detailed peptide/medication information using GPT-5.2
- Searchable + filterable by category
- Detail page with dosage ranges, side effects, protocols, storage
- "Quick Calculate" and "Add to Tracker" actions

### 6. Health Journal (Tab 4)
- Log: Weight, Energy (1-10), Sleep quality/hours, Mood (5 emojis), Notes
- Recent entries timeline
- 7-day trend bar charts
- Weight delta tracking

### 7. Profile & Settings (Tab 5)
- Guest user display / Google Auth sign-in
- **Light/Dark Mode Toggle** (NEW)
- Weight unit (lbs/kg) and measurement unit (in/cm) toggles
- Notifications toggle
- Data export and clear functionality
- Medical disclaimer

---

## Backend API Endpoints

### Core APIs
- `GET /api/` — Health check
- `POST /api/auth/session` — Google Auth session exchange
- `GET /api/auth/me` — Current user
- `POST /api/auth/logout` — Logout

### AI APIs
- `POST /api/ai/ask` — AI peptide Q&A (GPT-5.2)
- `POST /api/ai/summary` — AI health summary
- `POST /api/ai/web-search` — AI-powered research search (NEW)

### Recurring Items APIs (NEW)
- `POST /api/recurring-items` — Create recurring item
- `GET /api/recurring-items` — List all active recurring items
- `GET /api/recurring-items/{item_id}` — Get single item
- `PUT /api/recurring-items/{item_id}` — Update item
- `DELETE /api/recurring-items/{item_id}` — Soft delete (mark inactive)
- `GET /api/recurring-items/schedule/{date}` — Get items scheduled for date
- `POST /api/recurring-items/dose-log` — Log a dose (upsert)
- `GET /api/recurring-items/dose-logs/{date}` — Get logs for date

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

## Completed Tasks (Feb 2026)
- [x] Full app redesign ("grungy gym" theme)
- [x] Legal waiver implementation
- [x] Light/Dark mode system with ThemeContext
- [x] AI Web Search integration
- [x] **Recurring Items feature with calendar** (Feb 14, 2026)
  - [x] ScheduleCalendar component (week/month views)
  - [x] AddRecurringItemModal with full form
  - [x] Dose logging (Taken/Skipped/Delayed)
  - [x] Backend CRUD endpoints
  - [x] Schedule calculation for all recurrence types

---

## Upcoming Tasks
- [ ] Calculator: "Save as Preset" and "Add to Schedule" buttons
- [ ] Journal: Full logging UI with charts (Victory Native)
- [ ] Research: Full-text search, "Browse by Goal" filtering, Comparison Tool
- [ ] Push notifications for reminders

---

## Future/Backlog
- [ ] AI weekly health summaries
- [ ] Cloud sync with Google Auth
- [ ] Injection Site Rotation Tracker
- [ ] Data export (CSV/PDF)
- [ ] Biometric/PIN app lock
- [ ] OpenFDA API integration
