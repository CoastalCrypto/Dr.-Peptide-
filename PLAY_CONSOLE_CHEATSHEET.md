# Google Play Console — Form Answers Cheat Sheet

Use this document as a reference when filling out the Google Play Console forms.
Copy-paste answers directly into the console.

---

## APP CREATION

- **App name:** PepTrack Pro
- **Default language:** English (United States) — en-US
- **App or Game:** App
- **Free or Paid:** Free
- **Declarations:** Check all required boxes (Developer Program Policies, US export laws)

---

## STORE LISTING (Main Store Listing)

### Short Description (80 chars max)
```
Track peptides, supplements & medications. Calculate doses. Monitor your health.
```

### Full Description
> Copy the full description from `frontend/STORE_LISTING.md`

### App Category
- **Category:** Health & Fitness
- **Tags:** Health, Fitness, Medical, Lifestyle

### Contact Details
- **Email:** support@peptrackpro.com
- **Website:** https://coastalcrypto.github.io/Dr.-Peptide-/
- **Phone:** (optional, leave blank)

### Graphics
| Asset | File | Dimensions |
|-------|------|-----------|
| App Icon | `frontend/assets/images/icon.png` | 512x512 (Play Console auto-resizes from 1024) |
| Feature Graphic | `frontend/assets/images/feature-graphic.png` | 1024x500 |
| Phone Screenshots | Capture from Expo Go (see guide) | 1080x1920 recommended |

---

## DATA SAFETY FORM

This is the most complex form. Answer exactly as follows:

### Data Collection & Security

**Does your app collect or share any of the required user data types?**
→ **Yes**

**Is all of the user data collected by your app encrypted in transit?**
→ **Yes**

**Do you provide a way for users to request that their data is deleted?**
→ **Yes**

### Data Types Collected

| Data Type | Collected? | Shared? | Purpose | Optional? |
|-----------|-----------|---------|---------|-----------|
| Name | Yes (if Google Sign-In) | No | Account management | Yes |
| Email address | Yes (if Google Sign-In) | No | Account management | Yes |
| Health info | Yes | No | App functionality | No |
| Medications | Yes | No | App functionality | No |
| App interactions | Yes | No | Analytics | No |
| Crash logs | Yes | No | Analytics | No |
| Device or other IDs | Yes | No | Analytics | No |

### For EACH data type marked "Collected", answer:

**Is this data processed ephemerally?**
→ No (it's stored)

**Is this data required for your app, or can users choose whether it's collected?**
→ Health info, Medications: Required for app functionality
→ Name, Email: Optional (users can use Guest Mode)
→ App interactions, Crash logs, Device IDs: Required

**Reasons for collection:**
→ "App functionality" and "Analytics" (select both where applicable)

### Data Handling Summary (what users will see)

| | Shared | Collected |
|---|--------|-----------|
| Personal info (name, email) | None | Optional (Google Sign-In only) |
| Health info | None | Collected for app functionality |
| App activity | None | Collected for analytics |

**Data encryption:** Yes, in transit
**Data deletion:** Users can request deletion in-app

---

## CONTENT RATING QUESTIONNAIRE

Google uses the IARC system. Answer the questionnaire as follows:

**Category:** Utility / Productivity / Health

**Does the app contain:**

| Question | Answer |
|----------|--------|
| Violence | No |
| Sexual content | No |
| Language (profanity) | No |
| Controlled substances (references to drugs/alcohol) | **Yes — Educational/Informational reference** |
| Gambling | No |
| User-generated content | No |
| User interaction (chat, messaging) | No |
| Location sharing | No |
| Digital purchases | No (for MVP — change if you add subscriptions) |
| Ads | No |

**Note on "Controlled Substances":** The app references peptides and medications in an educational/informational context. Select "Yes" and indicate it's reference/educational content, not promotion. This typically results in an **"Everyone" or "Low Maturity"** rating, but Google may assign **"Teen"** or **"Mature 17+"** depending on how they classify peptide content.

**Expected rating:** Everyone or Teen

---

## TARGET AUDIENCE & CONTENT

**Target age group:** 18 and over
→ Select "18 and over" ONLY. Do NOT select any age group under 18.

**Does your app appeal to children?**
→ **No**

**Is your app a teacher-approved app?**
→ **No**

---

## ADS DECLARATION

**Does your app contain ads?**
→ **No**

---

## APP ACCESS

**Is all functionality available without special access or account?**
→ **Yes** (Guest Mode provides full access)

If they ask for a demo account:
→ Not required. App works in Guest Mode without authentication.

---

## APP CONTENT — NEWS APPS

**Is this a news app?**
→ **No**

---

## APP CONTENT — COVID-19

**Is this a COVID-19 contact tracing or status app?**
→ **No**

---

## APP CONTENT — GOVERNMENT APPS

**Is this a government app?**
→ **No**

---

## APP CONTENT — HEALTH APPS

Google may flag this as a health app and ask additional questions:

**Is this app a medical device?**
→ **No**

**Does this app provide medical diagnoses?**
→ **No**

**Does this app claim to treat or cure conditions?**
→ **No**

**Purpose of the app:**
→ Personal health tracking and informational reference. The app provides a dosage calculator (mathematical tool), an informational database, and personal logging/journaling features. It includes prominent disclaimers stating it is not a substitute for medical advice.

---

## FINANCIAL FEATURES

**Does your app provide financial trading features?**
→ **No**

---

## APP PRICING & DISTRIBUTION

**Countries:** All countries (or select specific markets)
**Paid / Free:** Free
**Contains ads:** No
**Content guidelines:** Acknowledged
**US export laws:** Acknowledged

---

## PRIVACY POLICY

**URL:** https://coastalcrypto.github.io/Dr.-Peptide-/privacy-policy.html

---

## PRE-SUBMISSION CHECKLIST

Before hitting "Submit for review":

- [ ] App icon uploaded (512x512)
- [ ] Feature graphic uploaded (1024x500)
- [ ] At least 2 phone screenshots uploaded (1080x1920 recommended)
- [ ] Short description filled in (80 chars)
- [ ] Full description filled in
- [ ] Privacy policy URL is live and accessible
- [ ] Data safety form completed
- [ ] Content rating questionnaire completed
- [ ] Target audience set to 18+
- [ ] App access set (All functionality available)
- [ ] Contact email set
- [ ] AAB uploaded to a release track
- [ ] Release notes written
- [ ] All dashboard warnings/errors resolved
