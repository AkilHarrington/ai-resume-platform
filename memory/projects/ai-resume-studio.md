# Project: AI Resume Studio

**Type:** SaaS product
**Owner:** Akil Harrington (founder, non-technical)
**Path:** `/Users/akilharrington/ai-resume-platform`
**Status:** Active development — pre-launch

## What It Is
AI-powered resume optimization platform. Users upload a resume, paste a job description, and get an ATS compatibility score, resume rewrite, cover letter, and LinkedIn optimization — all powered by Claude.

## Architecture
- **Backend:** FastAPI (Python), port 8000
- **Frontend:** React + TypeScript + Vite, port 5173
- **AI:** Anthropic Claude claude-sonnet-4-6 (all AI features)
- **Auth:** Supabase (stubbed — not yet wired)
- **Payments:** Stripe (stubbed — awaiting funds)

## Features
| Feature | Status | Notes |
|---------|--------|-------|
| Resume upload (PDF/DOCX/TXT) | ✅ Live | 5MB limit |
| ATS Scan (semantic) | ✅ Live | Requires API credits |
| ATS Scan (rule-based fallback) | ✅ Live | Used when no JD provided |
| Resume Optimize | ✅ Live | Pro gate enforced |
| Cover Letter | ✅ Live | Pro gate enforced |
| LinkedIn Optimizer | ✅ Live | Pro gate enforced |
| Pro gate | ✅ Live | `FORCE_PRO=true` in .env to test locally |
| Auth (Supabase) | 🔲 Deferred | |
| Payments (Stripe) | 🔲 Deferred | |

## Semantic ATS Scorer — 5 Dimensions
| Dimension | Weight |
|-----------|--------|
| Keyword Alignment | 35% |
| Experience Relevance | 25% |
| Seniority Match | 15% |
| Achievement Quality | 15% |
| Education & Credentials | 10% |

## Key Files
| File | Purpose |
|------|---------|
| `backend/main.py` | All FastAPI endpoints |
| `backend/services/semantic_ats_service.py` | Claude ATS scorer |
| `backend/services/resume_service.py` | Optimize / Cover Letter / LinkedIn |
| `backend/services/ats_service.py` | Rule-based scorer + keyword extraction |
| `backend/services/resume_parser.py` | Resume section parser |
| `backend/services/match_intelligence.py` | Match signals (used by ats_service) |
| `backend/.env.example` | All env vars documented |
| `frontend-app/src/pages/WorkspacePage.tsx` | Main UI — 612 lines, split pending |
| `frontend-app/src/api/resumeApi.ts` | All API calls + axios config |

## Env Vars (backend/.env)
```
ANTHROPIC_API_KEY=      # Required for all AI features
CLAUDE_MODEL=claude-sonnet-4-6
STRIPE_SECRET_KEY=      # When ready
STRIPE_MONTHLY_PRICE_ID=
STRIPE_ONETIME_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,...
SUPABASE_URL=           # When ready
SUPABASE_SERVICE_KEY=
FORCE_PRO=false         # Set true to bypass pro gate locally
```

## Dev Commands
```bash
# Backend
cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000

# Frontend
cd frontend-app && npm run dev
```

## Session History

### Session 1
- Fixed pip/setup issues, got local dev running
- Fixed PDF text extraction (CID glyph encoding bug)
- Fixed junk keyword detection (stopwords)
- Fixed "No improvement possible" showing incorrectly

### Session 2
- Built Claude semantic ATS scorer (5 dimensions)
- Updated scan endpoint + frontend ScanTab for semantic results

### Session 3
- Full code analysis across entire project
- Deleted 60 dead TypeScript files (backend/src/)
- Deleted 5 dead Python services
- Deleted dead frontend feature stubs
- Added 5MB upload limit
- Added 60s axios timeout with error handling
- Fixed scorer mismatch (optimize now uses semantic scorer)
- Wired real pro gate with UpgradePrompt component + FORCE_PRO override

## Next Session Priorities
1. Add Anthropic API credits (blocker)
2. End-to-end test: scan → optimize → cover letter → linkedin
3. Split WorkspacePage.tsx (612 lines) into tab components
4. Slim ats_service.py (653 lines — too broad now semantic is primary)
5. Move build_optimization_guidance() from main.py to a service
6. Add React error boundaries (one per tab)

## Deferred Features (do when told)
- Resume score history
- Resume formatter/fixer
- JD URL scraper
- DOCX download
- Multiple resume versions
- Interview prep
- Job match scoring
- LinkedIn import

## Test Resume
**Danielle Richards** — Senior Operations Coordinator, Arima Trinidad and Tobago
Used for all ATS scan and optimize testing.
