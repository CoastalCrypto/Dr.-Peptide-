# PepTrack Pro — Test Credentials

> This file is read by automated testing agents. Keep emails + passwords in sync with the actual seeded accounts.

## Authentication providers
- **Google SSO**: handled by Emergent Auth — no static demo credentials available. To test, an actual Google account is required.
- **Sign in with Apple**: requires a real Apple ID via the iOS native flow. Only works on iOS devices (not web).
  - In the App Store Connect review notes, Apple's reviewer should use their own Apple ID.
  - Backend uses real Apple JWKS verification, so there is no "demo" Apple token.

## Test account (Guest Mode)
- The app is fully usable in **Guest mode** with no account.
- Tap "Continue as Guest" on onboarding to bypass sign-in and use all local features.

## Backend pytest tests
Unit tests in `/app/backend/tests/test_apple_auth.py` mock Apple's JWKS with an ES256 keypair generated at test time — no real credentials needed.

## Notes for reviewers
- Apple reviewers: tap Profile tab → "Sign in with Apple" → confirm with Face ID/Touch ID.
- Google reviewers: tap Profile tab → "Sign in with Google" → use any Google account.
