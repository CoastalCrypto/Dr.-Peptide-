# PepTrack Pro — Product Requirements Document

## Overview
All-in-one health companion app for researching, calculating dosages, tracking usage, and monitoring health outcomes related to peptides, supplements, and prescription medications.

## Tech Stack
- **Frontend**: Expo (SDK 54) with React Native, expo-router (file-based routing), AsyncStorage (offline-first)
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **AI**: GPT-5.2 via Emergent LLM key (health summaries, peptide Q&A)
- **Auth**: Emergent Google Auth (optional, guest mode default)

## Features Implemented (MVP)

### 1. Onboarding Flow
- 3-slide feature overview + goal selection
- "Continue as Guest" (default) / Google Auth (optional)
- Goals: Weight Loss, Recovery, Anti-Aging, Muscle Growth, General Health, Medication Management

### 2. Home Dashboard (Tab 1)
- Greeting with current date
- Adherence ring (SVG circular progress)
- Today's dose schedule from tracked items
- Take / Skip dose actions
- FAB to add new tracked items (modal form)

### 3. Peptide Reconstitution Calculator (Tab 2) — Flagship Feature
- Syringe size selector (0.3/0.5/1.0 mL + custom)
- Vial amount selector (1-50 mg + custom)
- BAC water selector (0.5-5.0 mL + custom)
- Desired dose selector (50 mcg - 15 mg + custom)
- Real-time calculation: Units to Draw, mL to Draw, Concentration, Doses Per Vial
- Animated syringe visual (Reanimated fill)
- Warning banner when dose exceeds syringe capacity
- Save/load presets (AsyncStorage)

### 4. Research Database (Tab 3)
- 15 peptide profiles: BPC-157, TB-500, Semaglutide, Tirzepatide, CJC-1295+Ipamorelin, MK-677, GHK-Cu, Epithalon, Semax, PT-141, DSIP, Thymosin Alpha-1, AOD-9604, KPV, Melanotan II
- 12 medication profiles: Metformin, Levothyroxine, Atorvastatin, Lisinopril, Omeprazole, Sertraline, Metoprolol, Vitamin D3, Magnesium, Ashwagandha, Creatine, Omega-3
- Searchable + filterable by category
- Peptide detail page with dosage ranges, side effects, protocols, storage
- "Quick Calculate" and "Add to Tracker" actions from detail page

### 5. Health Journal (Tab 4)
- Log: Weight, Energy (1-10), Sleep quality/hours, Mood (5 emojis), Notes
- Recent entries timeline
- 7-day trend bar charts (custom Views)
- Weight delta tracking

### 6. Profile & Settings (Tab 5)
- Guest user display
- Google Auth sign-in button
- Weight unit (lbs/kg) and measurement unit (in/cm) toggles
- Notifications toggle
- Data export and clear functionality
- Medical disclaimer

## Backend API Endpoints
- `GET /api/` — Health check
- `POST /api/auth/session` — Google Auth session exchange
- `GET /api/auth/me` — Current user
- `POST /api/auth/logout` — Logout
- `POST /api/ai/ask` — AI peptide Q&A (GPT-5.2)
- `POST /api/ai/summary` — AI health summary
- `CRUD /api/tracker/items` — Tracked items
- `CRUD /api/tracker/doses` — Dose logs
- `CRUD /api/journal/entries` — Journal entries
- `CRUD /api/calculator/presets` — Calculator presets

## Design System
- Dark navy primary: #1B3A5C
- Surface: #152E48
- Primary blue: #2E75B6
- Accent teal: #4CC9F0
- Success: #06D6A0, Warning: #FFD166, Error: #EF476F
- Large dosage typography (48px display)
- 48px minimum touch targets

## Data Storage
- Guest mode: All data in AsyncStorage (offline-first)
- Authenticated: Optional cloud backup via MongoDB
