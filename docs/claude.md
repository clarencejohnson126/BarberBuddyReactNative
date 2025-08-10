# Claude Product Blueprint: BarberBuddy (Production Mobile App)

---

## ✨ Vision
BarberBuddy is a **production-grade, mobile-only AI haircut preview app** for iOS and Android. It empowers users to upload or capture a photo, select or prompt a hairstyle, and receive an ultra-realistic preview of their look. Everything is AI-driven, secure, and designed for scale (10,000+ concurrent users).

All transformations are powered by the **Replicate Flux Komplex Haircuts model** with strict enforcement of character consistency (face and background must remain unaltered). The app auto-detects and supports **English, German, Spanish, and Turkish**.

---

## 🔄 System Architecture (via Claude Agents)

### Phase 1: Product Definition & Architecture

#### 🧑‍🏬 Product Manager Agent
- Manages feature backlog and definitions
- Aligns roadmap with MVP enforcement rules

#### 🧑‍🎨 UX/UI Designer Agent
- Produces polished, frictionless UI/UX
- Validates with Playwright MCP for mobile

#### 🧑‍💻 System Architect Agent
- High-level blueprint:
  - **Frontend**: React Native (Expo)
  - **Backend**: FastAPI, PostgreSQL
  - **AI Layer**: Replicate API (Flux Komplex)
  - **Image Hosting**: Supabase or Cloudinary
  - **Auth & DB**: Supabase
  - **Payments**: Stripe + Superwall (MCP Stripe enabled)
  - **CI/CD + DevOps**: Railway + Docker
  - **Monitoring & QA**: Sentry, Semgrep, Playwright

---

## 🏋️ Claude Agent Loop
All features are created via a multi-agent loop:

1. Product Manager
2. UX Designer
3. Backend Engineer
4. Frontend Engineer
5. QA Engineer
6. DevOps Agent

> Each feature follows this loop from spec ➔ deployment. Claude acts as orchestrator and memory holder.

---

## 🏛️ Core MVP Feature Set (Governed by Claude)

### ✅ User Flow

1. **Photo Upload/Capture:** JPEG/PNG only, face framing required
2. **Haircut Selection:**
   - Dropdown list (hardcoded styles)
   - Optional: prompt-based input (warn about character consistency)
3. **Optional Enhancements:** Gender, hair color, image format
4. **Render Image:**
   - Via Replicate API
   - Only hair changes, face & background locked
5. **Result Delivery:**
   - Free tier: 1 render, download/share allowed
   - Paid tiers: in-app library access via Supabase
6. **Rate Limiting:**
   - Global: 1,000 free renders max
   - Admin notified at 500
   - Abuse prevention: 50 requests/hour/IP (via Claude security agent)
7. **Subscription Plans:**
   - Plus: $4.99/mo = 20 renders/month
   - Pro: $9.99/mo = 50 renders/month
8. **Marketplace (Grayed Out):**
   - Label: "Coming soon: Book barbers near you"
9. **User Feedback:**
   - Feedback form routes to support@barberbuddy.app

---

## 🧱 Robustness, Security & QA

### 🔐 Security & Privacy (Security Agent)
- Validates file formats client/server side
- API secrets secured via .env and PaaS config
- Personal data encrypted via Supabase
- No free-user storage, no public image URLs

### 🚫 Rate Limiting & Abuse Control
- Global cap: 1,000 free renders
- Per-user: 1 render on free tier
- Claude-managed abuse detection (e.g. repeated uploads, brute force)

### 📊 Monitoring & QA
- Crash/error monitoring: Sentry
- Security analysis: Semgrep
- Visual testing: Playwright + Claude test prompts

---

## 🚀 Deployment & Scale (10k+ Users)

### 🛠️ DevOps Agent Duties
- Deploys via Docker + Railway
- Health checks + auto-restarts
- Logs & alerts (Sentry, Supabase)
- Background jobs queued for image gen (e.g. Supabase Edge Functions or Celery)

### 📈 Scale Checklist
- Claude agent memory enabled
- Retry logic on Stripe webhooks
- Queued render jobs with progress indicators
- CDN-hosted images (Cloudinary or Supabase)
- Authorization checks for all requests

---

## 📊 Feature Compliance ("Respect-the-Spec" Agent)
- Compares live features against original specs
- Scores 0–10 for compliance
- Saves `.md` audit reports to `/docs/feature-tracking/`
- Used before shipping features or pushing PRs

---

## ✅ Claude Invocation Prompt
```markdown
@claude
Feature: [e.g. Haircut Render Flow]
Agents: PM ➔ UX ➔ Backend ➔ Frontend ➔ QA ➔ DevOps
Expectations:
- Adhere to MVP
- Claude memory ON
- Scalable up to 10k users
- Output stored in /docs/
```

---

## 🔗 Claude Governance & Enforcement

### 🌐 Project Structure
- Main codebase: `/BarberBuddy/`
- Env file: `/BarberBuddy/.env`
- Package.json: `/BarberBuddy/package.json`
- Source: `/BarberBuddy/src/`

### 🚫 Rules
- No "beta" features in production
- No exposed admin or debugging flows
- No hints to future features outside upgrade or marketplace section
- Every PR, test, and Claude output must align with this file

---

## 🔧 Integrations (MCPs & Tools)
- **claudecode** – Agent runtime + prompt copilot
- **Supabase** – DB, Auth, Image storage
- **Stripe + Superwall** – Billing, upgrades
- **Playwright** – UI test automation
- **Sentry** – Crash & error logs
- **Semgrep** – Static code security scans
- **Railway** – CI/CD deployment
- **Firecrawl / Code Rabbit / Brave / Context7** – Used internally only, not user-facing

---

## 🌟 Vision Statement
BarberBuddy is your pocket-sized barber with AI precision. Built for speed, realism, and trust, it offers ultra-personalized hair previews in seconds. All live features are stable, secure, and subscription-aware. Marketplace and advanced AI services are staged for future rollout.

---

## ✍️ Final Note
Use this `claude.md` file as your product bible. Update only via official product leadership. This file governs:
- AI agent prompts
- Dev team builds
- QA testing
- Live deployments

**Ship like you mean it.**
