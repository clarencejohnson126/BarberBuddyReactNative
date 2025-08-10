
# Barber Buddy

**Ultra-Realistic AI Haircut Preview App**
*Mobile Only · iOS & Android · Multi-language (EN/DE/ES/TR)*

---

## Overview

Barber Buddy lets you instantly visualize any haircut on your own photo—using state-of-the-art AI for ultra-realistic results. Upload or take a selfie, pick your style, and see yourself before your next trip to the barber.
**Available in English, German, Spanish, and Turkish.**

---

## Features

* **Photo Upload/Capture:** Take or select a selfie (JPEG/PNG, camera/gallery).
* **Haircut Selection:**

  * Choose from curated styles (multi-language dropdown).
  * Or type a custom prompt for unique looks (with character consistency warning).
* **Optional Enhancements:** Gender, color, and image format selectors (if supported).
* **AI-Powered Preview:** Ultra-realistic hair changes only—face and background always preserved.
* **One-Click Download/Share:** Save or share your new look instantly.
* **Personal Library:** Paid users can store and revisit all their looks (private, encrypted).
* **Free Use:** Every user gets one free image generation; after that, upgrade is available.
* **Marketplace:** “Coming soon” tab always visible (multi-language), not yet active.
* **Fully Localized:**

  * Auto-detects device language.
  * All app content and support in EN/DE/ES/TR.
  * User can switch language any time.

---

## Tech Stack

* **React Native (Expo)**
* **Replicate API** (Flux Komplex Haircuts Model)
* **Supabase** (auth, paid user storage)
* **Stripe** (subscriptions)
* **Playwright** (end-to-end testing)
* **Sentry** (error/crash monitoring)
* **Semgrep** (security/code scanning)
* **i18next** (internationalization)
* **Code Rabbit, Context7, Brave, Firecrawl, Superwall** (MCP/devops tools)

---

## Security & Privacy

* **All secrets stored in `.env` (never in repo/code).**
* **No user image or personal data is shared, sold, or used for AI training.**
* **GDPR/DSGVO compliant.**
* **Privacy policy and TOS provided in all supported languages.**

---

## Quality & Testing

* **100% automated E2E flow coverage (all languages, all flows).**
* **Manual device QA for language fit, UI/UX, and edge cases.**
* **Continuous security/code review with Semgrep.**
* **Errors and crashes logged and monitored in Sentry.**

---

## Getting Started (Dev)

1. **Clone Repo & Install:**
   `git clone ...`
   `cd barber-buddy && npm install`
2. **Set up `.env`:**
   Copy `.env.example` and add your secrets (see docs).
3. **Run in Expo:**
   `npx expo start`
4. **Test:**
   `npm run test` (unit)
   `npm run e2e` (Playwright)
5. **Build:**
   Follow Expo/React Native guide for iOS/Android builds.

---

## License

MIT (see LICENSE file)

---

## Contact & Support

For questions, translation help, or feedback, contact: [support@barberbuddy.app](mailto:support@barberbuddy.app)

---

**Barber Buddy—AI-powered confidence for your next haircut, available globally from day one.**

---
