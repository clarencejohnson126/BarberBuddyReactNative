# Barber Buddy – prp.md

**Purpose:**
Defines the exact requirements, constraints, and rules for building and maintaining the MVP and future extensibility of Barber Buddy, as governed by claude.md and initial.md. This file is to be referenced by all developers, product owners, and AI agents for any decision or automation.

---

## PRODUCT REQUIREMENT PROMPT (PRP)

---

### **1. Overview**

* **Product:** Barber Buddy – AI-powered mobile haircut preview app for iOS/Android.
* **MVP Scope:** Only features listed below are live, accessible, and documented.
* **Multi-language:** Full EN/DE/ES/TR support at launch; app auto-detects device language with manual override.
* **Security/Compliance:** No user data or secrets exposed; GDPR/DSGVO compliance mandatory; privacy policy & ToS in all four languages.

---

### **2. Core Requirements**

#### **Features (User-facing, MVP)**

* User uploads/captures photo (JPEG, PNG only).
* Must select or prompt a hairstyle (dropdown—curated, translated, or custom prompt field).
* Optional: select gender, color, output image format.
* All UI and flows fully localized (EN/DE/ES/TR).
* Submit data to Replicate API (Flux Komplex model) via secure backend call (API key from `.env`, never exposed).
* App shows loading state, disables double submissions, and provides clear feedback in user’s language.
* Rendered result: only hairstyle is altered, face/background are never changed.
* User can download/share result (always), and save to personal library (paid only).
* Free: 1 image/user (strict), global 1,000 free images/app-wide (admin notified at 500); block and prompt upgrade after limit.
* Paid: Plus (\$4.99/20 images/month), Pro (\$9.99/50 images/month), managed via Stripe/Superwall, with clear quota status.
* **User Feedback:** Contact form accessible via settings/help; all feedback sent privately to support@barberbuddy.app for app improvement.

#### **Marketplace**

* Always present in UI, always grayed-out, always labeled “Coming soon: Book barbers near you in-app.” (translated); never actionable before launch.

#### **Upgrade/Paywall**

* All advanced/future features (personalization, face shape, education, booking, chat, etc.) behind a paywall

---

### **3. Technical and DevOps Constraints**

* **Framework:** React Native (Expo managed workflow only).
* **Secrets:** All API keys in `.env` (read-only, never committed or hard-coded).
* **i18n:** All text managed by `react-i18next` or similar, no hard-coded strings.
* **State:** User/session/plan state managed via Context API/Redux.
* **Image storage:** Paid user images encrypted in Supabase; free user images never stored server-side.
* **Testing:** Playwright MCP for E2E, Jest for units, Sentry for crash/error logging; Semgrep in CI for code/security.
* **Release:** Only ship when QA confirms all four languages complete, all features stable, all flows compliant with App/Play Store and privacy rules.

---

### **4. Enforcement & Error Handling**

* No feature outside MVP or paywall is visible or hinted at.
* Missing translation: fallback to English and log for hotfix.
* If Replicate/API error: show clear, actionable message in user’s language, log via Sentry.
* If rate/user/plan limit hit: show precise, upgrade-prompted, localized messaging.
* Any .env or config error aborts launch with dev-only logs, never user-facing error.
* No API key/secrets ever reach logs, UI, or frontend code.

---

### **5. Value, User Trust, and Roadmap Discipline**

* Only what is described above is allowed in MVP; everything else is future or premium.
* Marketplace remains a teaser, not a feature, until live (do not remove from nav).
* App must provide instant value: zero friction, ultra-fast onboarding, seamless AI output, and flawless multi-language experience.

---

### **6. MCPs/Integration Rules**

* **Required MCPs:** claudecode, Supabase, Stripe, Playwright, Sentry, Semgrep, Code Rabbit, Expo, Superwall, react-i18next.
* **Feedback system:** Contact form integration for private user feedback to support@barberbuddy.app.
* **Modularity:** All features are modular for future extension (e.g., chat, booking, more languages).
* **CI/CD:** All pipelines must validate environment, secrets, translations, and core user flows before release.

---

### **7. Documentation & Governance**

* All engineering, product, and AI/automation work references this prp.md.
* No merge/release is valid unless compliant with all above points.
* If scope or features change, update this PRP, claude.md, and initial.md in sync—this is your living contract.

---

**Pro Tip:**
Review this PRP at every planning, standup, and code review. If ambiguity or technical challenge arises, resolve here first, then document in initial.md or examples.md as needed.

---
