Barber Buddy – initial.md
Purpose: This file is the technical foundation for MVP implementation. All mobile engineering, feature gating, security, UX/UI, and integration flows are described for maximum clarity and reproducibility.
Target platform: iOS/Android only, built with React Native (Expo).

1. App Architecture & Tech Stack
Framework: React Native (with Expo Managed Workflow)

Navigation: @react-navigation/native for stack/tab navigation

State Management: Context API + (optionally) Redux Toolkit for user/auth/subscription state

Internationalization: react-i18next for multi-language support (EN/DE/ES/TR)

Image Processing: Native device camera via Expo Camera; image picker via Expo ImagePicker

API Integration:

Replicate API: for all image generation (Flux Komplex model, REST via axios/fetch)

Supabase: User auth (email/social), paid user image library (storage/postgres)

Stripe: Payment and plan management, handled with Superwall

Superwall: Monetization and paywall flows, gating Plus/Pro features

Testing: Playwright MCP for E2E automation; Jest for unit tests

Monitoring: Sentry (JS + React Native SDK) for crash/error logging

Security:

.env file for all API keys/secrets (never committed, always read-only at runtime)

Semgrep for static code analysis and CI security checks

CI/CD: GitHub Actions (with iOS/Android Expo build), manual upload to App/Play Store

MCPs Utilized: claudecode, Supabase, Stripe, Playwright, Firecrawl, Context7, Brave, Sentry, Semgrep, Code Rabbit, Expo, Superwall

2. App Flow (User Experience)
Startup & Language Detection

On launch, detect device language (EN/DE/ES/TR). Load localized strings via i18n.

User can override language anytime in settings (persist with AsyncStorage).

Onboarding

Multi-language intro screens.

Consent for privacy policy/terms (localized).

Short guided tour (optional, skippable).

Photo Capture/Upload

Expo Camera/ImagePicker module (JPEG/PNG enforced; guide users if not supported).

Prompt user to crop/center face/hair.

Show preview and “Continue” to style selection.

Haircut Selection

Dropdown of curated, hardcoded styles (multi-language labels).

Optional prompt field for custom style (disclaimer about character consistency in UI and API request).

Gender, color, image format as optional dropdowns.

All selections validated before “Generate” is enabled.

Image Generation (Replicate API)

POST request to Replicate endpoint with user image, haircut (dropdown or prompt), and optional params.

API key securely loaded from .env.

Show animated progress/loading state, localized.

Poll for result; handle timeouts/errors gracefully.

Result & Output

Render generated image (only hair changes, face/background preserved).

Show before/after toggle (optional).

Buttons: Save (paid only, Supabase), Download, Share (native share sheet).

For free users: only 1 generation/session allowed; prompt upgrade at limit.

Subscription & Rate Limiting

Free: 1 image/user (tracked in local/device state + optional backend flag); app-wide 1,000 free images (tracked via backend/admin alert at 500).

Paid (Plus/Pro): plans via Stripe/Superwall, 20/50 images/month, image library unlocked (Supabase).

Upgrade/paywall screen with plan details, multi-language, legal copy.

Plan usage/remaining quota always visible to user.

Marketplace UI

Grayed-out icon/tab on home and nav.

Always labeled “Coming soon: Book barbers near you in-app” (multi-language).

No function/click, or modal with info if tapped.

Settings & Support

Language selection (i18n, AsyncStorage).

Privacy/legal documents, app version, logout.

Support contact (email), multi-language.

3. Security & Environment
API keys & sensitive config:

Only loaded from .env; never committed.

.env is read-only at runtime—cannot be changed from UI or by code after build.

.env.example provided for developer onboarding.

Secrets never exposed to frontend logs, UI, or error messages.

Static analysis (Semgrep) in CI: scans for leaks, insecure patterns, missing translations.

4. Testing & Quality
Automated E2E tests (Playwright):

Simulate user flows in all four languages.

Test all rate limit, subscription, and error edge cases.

Manual device QA:

All major flows in each language; test for layout/overflow.

Sentry:

Capture, log, and report all app, API, and crash errors with user language/context.

Code reviews:

Required for all PRs; security and i18n checklist enforced.

5. Analytics & Monitoring
Track:

Onboarding completion, language changes, successful/failed generations, upgrade/paywall views, plan upgrades, admin alerts.

Mixpanel or Supabase for event tracking/analytics.

6. Value & Data
Paid user images:

Encrypted, stored in Supabase, linked to user account.

Free user images:

Not stored server-side—user can download/share only.

No user images used for AI training, third-party, or analytics without explicit opt-in.

GDPR/DSGVO compliance enforced; legal copy available in all four languages.

7. Deployment & App Store Compliance
Expo build for iOS/Android; CI pipeline for continuous releases.

App Store/Play Store listing localized (EN/DE/ES/TR), with screenshots per language.

App size, privacy, permissions, and performance must meet store guidelines.

8. Extensibility
All UI strings managed via i18n; never hard-coded.

MCPs allow easy extension (chat, booking, more languages) in future versions.

Modular architecture (feature folders/components/services pattern).

Summary:
This initial.md is the full-stack, end-to-end, multi-language MVP build spec. All contributors, CI/CD, and AI agents must follow these technical and procedural standards. If in doubt, this file governs.
Appendices (API contract, i18n keys, .env template) can be provided on request.