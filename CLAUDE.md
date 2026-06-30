# Memory — AI Resume Studio

## Me
Akil Harrington, founder of AI Resume Studio. Non-technical. Building an AI-powered resume optimization SaaS.

## Project
| Field | Value |
|-------|-------|
| **Name** | AI Resume Studio |
| **Path** | `/Users/akilharrington/ai-resume-platform` |
| **Backend** | FastAPI (Python), runs on port 8000 |
| **Frontend** | React + TypeScript + Vite, runs on port 5173 |
| **AI** | Anthropic Claude claude-sonnet-4-6 (all features) |
| **Auth** | Supabase — fully wired (login, signup, session, profiles table) |
| **Payments** | Stripe — checkout live, webhook wired, price IDs set |
| **Database** | Supabase — `profiles` table with `is_pro`, `stripe_customer_id`, `stripe_subscription_id` |
| **Test resume** | Danielle Richards (Senior Operations Coordinator) |

## Stack Terms
| Term | Meaning |
|------|---------|
| **semantic scorer** | Claude-powered ATS scorer (`semantic_ats_service.py`) — primary |
| **rule-based scorer** | Keyword-matching ATS scorer (`ats_service.py`) — fallback / keyword extraction |
| **FORCE_PRO** | `backend/.env` flag — set to `true` to bypass pro gate locally without Stripe |
| **pro gate** | UpgradePrompt shown on Optimize/Cover Letter/LinkedIn tabs when `isPro=false` |
| **JD** | Job description (pasted by user for ATS scan) |
| **semantic scan** | ATS scan using Claude — requires API credits |

## Current State (after session 11 — dark mode + PDF backend complete)

### ✅ Done
- Claude semantic ATS scorer — 6 dimensions (Human Readability 5%, Keyword Alignment 30%)
- Optimizer prompt: banned 20 AI buzzwords, preserves voice, demands specificity and quantification
- Cover letter prompt: banned hollow openers, enforces human-sounding specific output
- PDF download: @react-pdf/renderer wired into OptimizeTab — 3 templates (Professional, Modern, Executive)
- Pro gate: real enforcement via `isPro` from `/api/user/pro-status`; `FORCE_PRO` env override
- File size limit: 5MB on upload endpoint; PDF magic bytes check (`%PDF-` header)
- Axios timeout: 60s with readable error message
- Scorer consistency: optimize uses semantic scorer for displayed before/after scores
- Full project cleanup: zero dead files, no duplicate frontends (session 13: removed DashboardTab, Sidebar, SkeletonLoader, Button, scoreUtils + dead build_resume_optimization_prompt/optimize_resume_text from resume_service.py)
- Company vision document: `AI-Resume-Studio-Vision.docx`
- **Supabase auth**: signup, login, logout, session persistence via `AuthContext`
- **Supabase profiles table**: auto-created on signup, `is_pro` field, RLS enabled
- **Stripe checkout**: live with real price IDs (monthly $19, one-time $49)
- **Stripe webhook**: `/api/payments/webhook` flips `is_pro=true` in Supabase on `checkout.session.completed`
- **Auth routing**: unauthenticated users redirected to `/login`; landing page routes to `/signup` or `/workspace` based on session
- **Login/Signup pages**: `/login` and `/signup` with email confirmation flow
- **Workspace header**: shows user email, PRO badge, Sign Out button, dark mode toggle
- **Homebrew + Stripe CLI**: installed and authenticated locally
- **Supabase + Stripe keys**: all wired into both `.env` files
- **Security hardening**:
  - JWT verification on every backend endpoint via `get_current_user()` FastAPI Depends
  - Server-side pro gate via `require_pro()` — 403 before any Claude call; Supabase outage → 503 (not silent demotion)
  - Rate limiting via slowapi: 20/min upload, 10/min scan, 5/min optimize/cover/linkedin, 30/min pro-status
  - FORCE_PRO production guard — `sys.exit(1)` if ENVIRONMENT=production + FORCE_PRO=true
  - Subscription cancellation webhook (`customer.subscription.deleted` → flips `is_pro=false`) — logs on failure, no silent pass
  - HTTP security headers middleware: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS (prod only)
  - Startup env var validation (production) — `sys.exit(1)` on missing critical vars
- **Claude fallback error handling**: `AIUnavailableError` propagates auth/rate/connection errors as 503 with readable messages
- **React error boundaries**: `ErrorBoundary` class component wraps each tab; shows named error card + "Try again" button
- **WorkspacePage split**: monolith broken into feature files — 0 TypeScript errors
  - `src/features/workspace/shared.tsx` — LoadingCard, EmptyState, EmptyCard, UpgradePrompt
  - `src/features/workspace/ScanTab.tsx` — ATS scan results, pro-gated recruiter verdict + strengths/gaps
  - `src/features/workspace/OptimizeTab.tsx` — resume optimizer, before/after scores, PDF download
  - `src/features/workspace/CoverLetterTab.tsx` — cover letter generator
  - `src/features/workspace/LinkedInTab.tsx` — LinkedIn headline + About optimizer
  - `src/pages/WorkspacePage.tsx` — **guided 5-step flow** (see session 12 below)
- **Principal code review — all 28 actionable issues resolved**:
  - CRITICAL: sync def handlers (thread pool, no event loop blocking), fabricated +3 removed, /health checks real deps
  - HIGH: singleton clients, silent excepts removed, Router.navigate, max_tokens 8192, rate limit pro-status, structured logging, prompt injection XML delimiters, startup env validation, 26-test pytest suite
  - MEDIUM: React hooks ordering, enabled:!!user guard, LCS dep array fixed, SSE null guard, scaleX animation, Haiku model alias, security headers
  - LOW: `--success` color → #047857 (WCAG AA 4.54:1), high-visibility focus rings (button/a/[role=tab])
  - Deferred: API versioning prefix (pre-launch disruption), Zod runtime validation (half-day project)
- **Privacy policy + Terms of Service**: `/privacy` and `/terms` routes, linked in footer and signup
- **Backend PDF service** (`backend/services/pdf_service.py`): ReportLab renders all 3 resume templates + cover letter; endpoints `/api/resume/download-pdf` and `/api/cover-letter/download-pdf`
- **Dark mode — semantic token architecture (GitHub palette)**:
  - `ThemeContext.tsx` — React context, `localStorage` persistence, `prefers-color-scheme` OS fallback
  - `globals.css` — primitive tokens never change; semantic role tokens (`--text-primary`, `--surface-0`, etc.) override per theme
  - GitHub dark palette: page #0D1117, cards #161B22, raised #21262D, overlay #2D333B (tonal elevation)
  - Toggle button in both workspace header and landing page nav
  - All pages updated: LandingPage, WorkspacePage, LoginPage, SignupPage, PricingPage, PrivacyPage, TermsPage, all workspace tabs
  - TypeScript clean (0 errors) after full migration

- **Guided 5-step workspace redesign (session 12)**:
  - `DashboardTab.tsx` — deprecated (no longer imported); replaced by `SetupStep` inline in WorkspacePage
  - `WorkspacePage.tsx` fully rewritten: 5-step indicator bar (dots + lines, green when done) + minimal nav row (logo, PRO badge, email, theme, sign out) + `SetupStep` for step 1 (resume upload zone + JD textarea + optional company/targetRole) + contextual `NextBanner` at bottom (always tells user exactly what to do next)
  - NextBanner logic: no resume → "Upload" | step 1 no JD → disabled | step 1 + JD → "Run ATS Scan" | step 2 → "Optimize →" | step 3 → "Generate Cover Letter →" | step 4 → "Optimize LinkedIn →" | step 5 done → "All done 🎉"
  - JD drawer removed — JD textarea lives inline on Step 1
  - Mobile: step number bar at bottom replaces old icon tab bar
  - 0 TypeScript errors

### 🔲 Next session
1. **Add Anthropic API credits** (blocker — nothing AI works without this)
2. **Test end-to-end** with Danielle's resume + JD (scan → optimize → cover letter → linkedin → PDF download)
3. **Set FORCE_PRO=false** and test real Stripe → webhook → Supabase → pro unlock flow
4. **Deploy** — backend to Render, frontend to Vercel

### Deferred (explicit)
- API versioning (/api/v1 prefix) — add after deploy, not before
- Zod runtime validation for API responses — post-launch hardening
- Resume score history
- JD URL scraper
- DOCX download
- Multiple resume versions
- Interview prep
- Job match scoring
- LinkedIn import
- International CV format support (UK/EU conventions)

### Platform Self-Learning (post-launch, ~200 users)
Industry standard in 2026 for Claude-backed SaaS is **retrieval-augmented prompting** (dynamic few-shot from own database) — NOT fine-tuning (Anthropic doesn't offer it for Sonnet/Haiku).

**Three things to build in order of impact:**

1. **Dynamic few-shot injection** (highest value) — When a user submits for optimization, query `scan_results` for the 1–2 previous jobs with the highest `score_improvement` in a similar role/industry, prepend as examples in the optimizer prompt. Claude sees real before/after pairs from our own users. Prerequisite: 200+ completed optimizations in DB; below that threshold, examples can *hurt* (documented "few-shot collapse" phenomenon). Implementation: ~1 Supabase query + ~20 lines in `resume_service.py`.

2. **Role/industry keyword intelligence** — Aggregate `missing_keywords` across scans grouped by job title. Build a dynamic "users who included X, Y, Z scored 15 points higher for PM roles" dataset injected into optimizer prompt. Data already exists in `scan_results`.

3. **Prompt A/B testing** — Log prompt version per result, track mean score improvement per variant, run experiments. Tools: Statsig or Arize.

**Action required at 200 users:**
- Add `high_performer boolean` column to `scan_results` (score_improvement ≥ 15)
- Build retrieval query in `resume_service.py`
- A/B test with vs. without injected examples

## Dev Commands
```bash
# Backend (from ai-resume-platform/backend/)
source .venv/bin/activate && uvicorn main:app --reload --port 8000

# Frontend (from ai-resume-platform/frontend-app/)
npm run dev

# Stripe webhook listener (separate terminal, keep running)
stripe listen --forward-to localhost:8000/api/payments/webhook
```

## Key Files
| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI router — all endpoints incl. Stripe webhook |
| `backend/services/semantic_ats_service.py` | Claude-powered ATS scorer (6 dimensions) |
| `backend/services/resume_service.py` | Optimize, cover letter, LinkedIn via Claude |
| `backend/services/supabase_service.py` | Supabase client — get/set pro status, user lookup |
| `backend/services/ats_service.py` | Rule-based scorer (keyword extraction fallback) |
| `backend/services/resume_parser.py` | Section/contact parser |
| `backend/models/` | 4 Pydantic request models (scan, optimize, cover_letter, linkedin) |
| `frontend-app/src/pages/WorkspacePage.tsx` | Thin shell — imports from features/workspace/ |
| `frontend-app/src/features/workspace/` | ScanTab, OptimizeTab, CoverLetterTab, LinkedInTab, shared |
| `frontend-app/src/components/ErrorBoundary.tsx` | Per-tab error boundary with "Try again" button |
| `backend/services/exceptions.py` | AIUnavailableError — propagates Claude downtime as 503 |
| `frontend-app/src/pages/LoginPage.tsx` | Login page |
| `frontend-app/src/pages/SignupPage.tsx` | Signup page with email confirmation |
| `frontend-app/src/app/AuthContext.tsx` | Supabase auth context — user, session, signIn, signUp, signOut |
| `frontend-app/src/services/supabase.ts` | Supabase client (uses VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY) |
| `frontend-app/src/api/resumeApi.ts` | All API calls, axios config |
| `frontend-app/src/app/AppShell.tsx` | Router — all routes incl. /login, /signup, /privacy, /terms |
| `frontend-app/src/app/ThemeContext.tsx` | Dark/light theme context with localStorage + OS fallback |
| `frontend-app/src/features/resume-templates/` | 3 template configs + ResumePDF renderer |
| `frontend-app/src/styles/globals.css` | CSS primitives + semantic tokens; GitHub dark palette |
| `backend/services/pdf_service.py` | ReportLab PDF generation for all 3 resume templates + cover letter |
| `frontend-app/src/pages/PrivacyPage.tsx` | /privacy route |
| `frontend-app/src/pages/TermsPage.tsx` | /terms route |

## Project Rating
**Current: 8.5/10** — dark mode, privacy/ToS, backend PDF, all code review issues done. Production-ready architecture.
Gap to 10: Anthropic credits + end-to-end test (blocker), deployment to Render/Vercel, post-launch API versioning + Zod validation.
