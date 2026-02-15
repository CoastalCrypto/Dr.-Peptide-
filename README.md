# PepTrack Pro

**Your All-in-One Health Tracking Companion**

Track peptides, supplements, and medications. Calculate reconstitution doses. Monitor your health journey.

## Features

- **Peptide Calculator** — Reconstitution calculator with visual syringe, saved presets, and real-time dose calculation
- **Research Database** — 29 peptide profiles + 20 medications with dosage guidelines, side effects, and AI-powered search
- **Smart Scheduling** — Recurring dose tracking with calendar view, adherence stats, and push notification reminders
- **Health Journal** — Log weight, energy, sleep, mood, and pain with 7-day trend charts
- **Light & Dark Mode** — Full theme support with automatic system detection

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo SDK 54) with TypeScript |
| Navigation | Expo Router with bottom tabs |
| Backend | FastAPI (Python) |
| Database | MongoDB (via Motor async driver) |
| Auth | Google OAuth via Emergent + Guest Mode |
| AI | Emergent LLM integration for research & summaries |
| Build | EAS Build (Expo Application Services) |

## Project Structure

```
├── frontend/               # React Native / Expo app
│   ├── app/                # Screens (Expo Router file-based routing)
│   │   ├── (tabs)/         # Home, Calculator, Research, Journal, Profile
│   │   ├── onboarding.tsx  # First-launch onboarding flow
│   │   ├── waiver.tsx      # Medical disclaimer acceptance
│   │   └── peptide/[id]    # Dynamic peptide detail screen
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # Theme context provider
│   │   ├── data/           # Bundled peptide & medication JSON data
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # API client, storage helpers
│   ├── assets/             # Icons, splash screen, feature graphic
│   ├── app.json            # Expo configuration
│   ├── eas.json            # EAS Build profiles
│   └── STORE_LISTING.md    # Google Play / App Store listing copy
├── backend/                # FastAPI server
│   ├── server.py           # Main API server
│   └── requirements.txt    # Python dependencies
├── docs/                   # GitHub Pages site
│   ├── index.html          # Landing/support page
│   ├── privacy-policy.html # Privacy policy (required by app stores)
│   └── terms-of-service.html
└── tests/                  # Test suite
```

## Getting Started

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.10+
- MongoDB (local or Atlas)
- Expo Go app on your phone
- EAS CLI: `npm install -g eas-cli`

### Backend
```bash
cd backend
cp .env.example .env        # Edit with your MongoDB connection string
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### Frontend
```bash
cd frontend
cp .env.example .env        # Edit with your backend URL
yarn install
npx expo start              # Scan QR code with Expo Go
```

### Production Build (Android)
```bash
cd frontend
eas build --platform android --profile production
```

## Deployment

### GitHub Pages (Privacy Policy & Support)
Enable GitHub Pages: Settings → Pages → Source: branch `main`, folder `/docs`

Live at: `https://coastalcrypto.github.io/Dr.-Peptide-/`

## Disclaimer

PepTrack Pro is for informational and personal tracking purposes only. Not a substitute for professional medical advice. Always consult a qualified healthcare provider.
