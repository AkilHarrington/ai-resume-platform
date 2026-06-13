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
| **Auth** | Supabase — stubbed, not yet wired |
| **Payments** | Stripe — stubbed, awaiting funds |
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

## Current State (after session 4)

### ✅ Done
- Claude semantic ATS scorer — 6 dimensions (added Human Readability 5%, Keyword Alignment reduced to 30%)
- Optimizer prompt: banned 20 AI buzzwords, preserves voice, demands specificity and quantification
- Cover letter prompt: banned hollow openers, enforces human-sounding specific output
- PDF download: @react-pdf/renderer wired into OptimizeTab — 3 templates (Professional, Modern, Executive)
- Pro gate: real enforcement via `isPro` from `/api/user/pro-status`; `FORCE_PRO` env override
- File size limit: 5MB on upload endpoint
- Axios timeout: 60s with readable error message
- Scorer consistency: optimize uses semantic scorer for displayed before/after scores
- Full project cleanup: 57 files, zero dead weight, no duplicate frontends
- Company vision document: `AI-Resume-Studio-Vision.docx`

### 🔲 Next session
1. **Add Anthropic API credits** (blocker — nothing AI works without this)
2. **Test end-to-end** with Danielle's resume + JD (scan → optimize → cover letter → linkedin)
3. **Wire Stripe** — real payment path to Pro
4. **Wire Supabase auth** — replace FORCE_PRO env flag with real user accounts
5. **WorkspacePage split** — monolith → `ScanTab.tsx`, `OptimizeTab.tsx`, `CoverLetterTab.tsx`, `LinkedInTab.tsx`
6. **React error boundaries** — one per tab so crashes don't blank the whole workspace

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
```

## Key Files
| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI router — all endpoints |
| `backend/services/semantic_ats_service.py` | Claude-powered ATS scorer (6 dimensions) |
| `backend/services/resume_service.py` | Optimize, cover letter, LinkedIn via Claude |
| `backend/services/ats_service.py` | Rule-based scorer (keyword extraction fallback) |
| `backend/services/resume_parser.py` | Section/contact parser |
| `backend/services/match_intelligence.py` | Used by ats_service for match signals |
| `backend/models/` | 4 Pydantic request models (scan, optimize, cover_letter, linkedin) |
| `frontend-app/src/pages/WorkspacePage.tsx` | Main UI — split pending |
| `frontend-app/src/api/resumeApi.ts` | All API calls, axios config |
| `frontend-app/src/features/resume-templates/` | 3 template configs + ResumePDF renderer |

## Project Rating
**Current: 8/10** — solid AI pipeline, clean architecture, PDF download live, human readability scoring added.
Gap to 9: Stripe + Supabase wired, WorkspacePage split, error boundaries.
