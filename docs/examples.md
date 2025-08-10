Barber Buddy – examples.md
Purpose: Showcase best practices for building and operating the MVP as defined in claude.md. No user Q&A or chat yet—these are developer, product, and ops “gold standard” reference examples.

1. Replicate API: Sending and Fetching Data
Example: Submitting Image Generation Request

On haircut selection (dropdown or prompt), the app packages user image (JPEG/PNG), chosen style/prompt, and any optional parameters (gender, color, format) into a POST request.

The API key is read only from a static .env file (never hard-coded or committed to repo).

The API call is made asynchronously; user sees a non-blocking, multi-language loading animation (“Generating your new look...”).

Best Practice: Always sanitize and validate user data before sending. If API returns a warning about character consistency (for prompt use), show localized disclaimer.

Example: Handling Replicate API Errors

If network fails, model is overloaded, or image format is invalid:

Show clear, localized message (“Service temporarily unavailable. Please try again later.”)

Log error for Sentry and flag user language/context in error payload.

No unhandled error or stack trace ever reaches the user.

2. .env File Handling and Security
Example: Secure Environment Configuration

All secrets (API keys, DB URIs, etc.) are stored only in .env (not in code, not in repo).

ClaudeCode and dev tools are configured to never overwrite or edit .env in production—strict read-only policy.

On app launch, check for required .env vars and abort with dev-only error if missing.

Best Practice: Each dev receives .env.example only; true secrets are managed via encrypted devops pipeline.

3. Frictionless User Experience (UX)
Example: No-Frustration Onboarding

On first launch, app auto-detects device language (EN/DE/ES/TR), but allows user override.

All labels, flows, and buttons are always clear, never ambiguous; multi-language onboarding walks user through first upload and render in <30 seconds.

If user tries to select advanced feature (before chat or other v2 features), show paywall—not a dead end.

Best Practice: If user flow is blocked (e.g., due to rate limits), guide to value: “Upgrade to unlock more styles—see what’s possible!”

Example: Handling Rate Limits and Plan Upgrades

If free limit reached (1/user, 1,000 app-wide), show precise, actionable, and localized upgrade path—never a generic error.

All upgrade/paywall content is 100% localized.

4. Multi-Language Integration
Example: String and Copy Handling

All app copy, system messages, and legal text are dynamically pulled from i18n files—no hard-coded text.

Each screen and modal adapts to language (auto or manual).

If translation is missing, fallback to English and log for patch.

Best Practice: Run automated tests to catch overflow or truncation in longer strings (especially for German/Turkish).

5. Value Creation & Data Integrity
Example: User Data Handling and Library

On paid plan, user images are stored securely in Supabase, accessible only to user.

On free plan, no image is stored—only local download/share permitted.

All images are processed according to privacy policy; never shared or used for training.

Best Practice: Never store PII or images on device or server without explicit user opt-in.

Example: Subscription and Upgrade Flow

All plans (Plus/Pro) are managed via Stripe/Superwall; plan limits and usage are enforced in backend, never on frontend only.

User always sees real-time plan status and upgrade options, in their selected language.

6. Quality, Testing, and Error Recovery
Example: Automated Testing and Monitoring

Playwright MCP runs all major flows (upload, render, save, upgrade) in each language before every release.

Sentry captures all backend/API errors with full language/user context.

Semgrep audits code for secrets, insecure patterns, and i18n completeness.

Example: Graceful Failure

If Replicate or payment API is down, user gets a non-technical, positive message (“We’re upgrading our barbershop. Please check back soon.”) in their chosen language.

No hard crash, app remains stable; user can retry or exit.

7. UI/UX and Marketplace Handling
Example: Marketplace UI State

Marketplace icon/section is always visible, always grayed out, always labeled “Coming soon” (multi-language).

Clicking/tapping does nothing, or shows a friendly info modal in the selected language.

Note:
Every code PR, QA script, and feature spec must reference this examples.md and claude.md.
If a new edge case arises, document it here—this file is your best practice living standard.