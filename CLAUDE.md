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

## Current State (after session 6)

### ✅ Done
- Claude semantic ATS scorer — 6 dimensions (Human Readability 5%, Keyword Alignment 30%)
- Optimizer prompt: banned 20 AI buzzwords, preserves voice, demands specificity and quantification
- Cover letter prompt: banned hollow openers, enforces human-sounding specific output
- PDF download: @react-pdf/renderer wired into OptimizeTab — 3 templates (Professional, Modern, Executive)
- Pro gate: real enforcement via `isPro` from `/api/user/pro-status`; `FORCE_PRO` env override
- File size limit: 5MB on upload endpoint
- Axios timeout: 60s with readable error message
- Scorer consistency: optimize uses semantic scorer for displayed before/after scores
- Full project cleanup: zero dead files, no duplicate frontends
- Company vision document: `AI-Resume-Studio-Vision.docx`
- **Supabase auth**: signup, login, logout, session persistence via `AuthContext`
- **Supabase profiles table**: auto-created on signup, `is_pro` field, RLS enabled
- **Stripe checkout**: live with real price IDs (monthly $19, one-time $49)
- **Stripe webhook**: `/api/payments/webhook` flips `is_pro=true` in Supabase on `checkout.session.completed`
- **Auth routing**: unauthenticated users redirected to `/login`; landing page routes to `/signup` or `/workspace` based on session
- **Login/Signup pages**: `/login` and `/signup` with email confirmation flow
- **Workspace header**: shows user email, PRO badge, Sign Out button
- **Fixed**: `resumeApi.ts` broken `./config` import replaced with inline `import.meta.env`
- **Homebrew + Stripe CLI**: installed and authenticated locally
- **Supabase + Stripe keys**: all wired into both `.env` files
- **Security hardening (session 6)**:
  - JWT verification on every backend endpoint via `get_current_user()` FastAPI Depends
  - Server-side pro gate via `require_pro()` — 403 before any Claude call
  - Rate limiting via slowapi: 20/min upload, 10/min scan, 5/min optimize/cover/linkedin
  - FORCE_PRO production guard — `sys.exit(1)` if ENVIRONMENT=production + FORCE_PRO=true
  - Subscription cancellation webhook (`customer.subscription.deleted` → flips `is_pro=false`)
- **Claude fallback error handling**: `AIUnavailableError` propagates auth/rate/connection errors as 503 with readable messages
- **React error boundaries**: `ErrorBoundary` class component wraps each tab; shows named error card + "Try again" button
- **WorkspacePage split**: monolith broken into feature files — 0 TypeScript errors
  - `src/features/workspace/shared.tsx` — LoadingCard, EmptyState, EmptyCard, UpgradePrompt
  - `src/features/workspace/ScanTab.tsx` — ATS scan results, pro-gated recruiter verdict + strengths/gaps
  - `src/features/workspace/OptimizeTab.tsx` — resume optimizer, before/after scores, PDF download
  - `src/features/workspace/CoverLetterTab.tsx` — cover letter generator
  - `src/features/workspace/LinkedInTab.tsx` — LinkedIn headline + About optimizer
  - `src/pages/WorkspacePage.tsx` — thin 272-line shell, imports from feature files

### 🔲 Next session
1. **Add Anthropic API credits** (blocker — nothing AI works without this)
2. **Test end-to-end** with Danielle's resume + JD (scan → optimize → cover letter → linkedin → PDF download)
3. **Set FORCE_PRO=false** and test real Stripe → webhook → Supabase → pro unlock flow
4. **Deploy** — backend to Render, frontend to Vercel
5. **Privacy policy + Terms of Service** — required before public launch

### Deferred (explicit)
- Resume score history
- JD URL scraper
- DOCX download
- Multiple resume versions
- Interview prep
- Job match scoring
- LinkedIn import
- International CV format support (UK/EU conventions)

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
| `frontend-app/src/app/AppShell.tsx` | Router — all routes incl. /login, /signup |
| `frontend-app/src/features/resume-templates/` | 3 template configs + ResumePDF renderer |

## Project Rating
**Current: 9.5/10** — security hardened, error resilient, component architecture clean, zero TS errors.
Gap to 10: Anthropic credits + end-to-end test, deployment, privacy policy/ToS.
