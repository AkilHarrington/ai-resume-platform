# AI Resume Studio — Feature Implementation Guide 2026
*Technical implementation notes for 5 prioritised features. Research-backed, cross-referenced.*

---

## Feature 1 — Optimization Preview for Free Users

### Recommended Approach
Show the first optimized bullet in full, the next two blurred, and a gradient fade below — all beneath the existing UpgradePrompt. The blur is CSS-only (`filter: blur(4px)`); the real text is in the DOM but hidden from screen readers via `aria-hidden="true"`. A separate visually-hidden accessible label tells screen reader users what is behind the gate.

**Do not use a functional resume layout** — keep the preview exactly as the full optimization looks, just truncated.

### Tech Stack Specifics

**Backend** — Add a new endpoint `POST /api/resume/preview-optimize`. It takes the same inputs as the full optimizer but uses **Claude Haiku** (not Sonnet) and sets `max_tokens=400`. Prompt it to return only the first 3 bullet points of the experience section, not the full resume. Estimated cost: ~$0.001 per preview call. No streaming needed — return as a JSON block since it's short.

```python
# backend/services/resume_service.py — new function
def generate_preview_bullets(resume_text: str, job_description: str) -> str:
    """Returns first 3 optimized bullets only. Uses Haiku for cost efficiency."""
    # System prompt: same OPTIMIZER_SYSTEM_PROMPT with cache_control
    # User message: ask for first 3 bullets only, plain text output
    # max_tokens=400, model=claude-haiku-4-5-20251001
```

**Frontend** — In `OptimizeTab.tsx`, after the ATS scan completes (Step 2), call the preview endpoint for free users. Display:
- Bullet 1: full, no blur
- Bullets 2–3: `filter: blur(4px); user-select: none; pointer-events: none; aria-hidden="true"`
- Below: gradient fade into the existing UpgradePrompt

```tsx
// CSS pattern (add to globals.css)
.preview-blurred {
  filter: blur(4px);
  user-select: none;
  pointer-events: none;
}
// Accessible label for screen readers
<span className="sr-only">
  2 more optimized bullets — upgrade to Pro to see your full optimization
</span>
```

### CTA Copy That Converts
Research confirms that personalized, action-forward CTAs outperform generic ones. Avoid "Upgrade to Pro." Use instead:
- **"See your full optimization →"** (personalized, value-first)
- **"Unlock your optimized resume"** (action-oriented)
- Animated button: 2.9× higher conversion than static (Qonversion, 2025) — add a subtle pulse or shimmer on the CTA

One publisher found "Continue" outperformed detailed CTAs 5× — keep the upgrade button copy short and direct.

### WCAG / Accessibility
- `aria-hidden="true"` on all blurred content — removes it from the accessibility tree
- Never place buttons or links inside the blurred zone
- Provide a `sr-only` span with descriptive text for screen reader users
- Blurred text still exists in the DOM — do not put sensitive user data in it (the bullets are the user's own resume text, which is fine)
- WCAG 1.3.1 risk: avoid using `opacity: 0` or `visibility: hidden` alone without `aria-hidden`

### Key Risks
- **Bypass risk**: CSS blur can be removed with browser dev tools. This is expected and acceptable — the content is the user's own resume. Determined users can see it; casual users won't bother. The goal is friction reduction, not DRM.
- **Cost**: Haiku preview calls at $0.001 each are negligible. Add to the existing 5/min rate limit.
- **Do not call preview if user is already Pro** — check `isPro` on the frontend before firing the request.

### Estimated Effort
**Half a day.** One new endpoint, one CSS class, minor OptimizeTab update.

### Resources
- [Frontend Hero — Blurred Paywall Tutorial](https://www.frontendhero.dev/tutorial/blurred-paywall-area/)
- [Qonversion — Paywall Design Examples](https://qonversion.io/blog/paywall-design-uiux-examples)
- [a11y-collective — aria-hidden](https://www.a11y-collective.com/blog/aria-hidden-meaning/)
- [RevenueCat — State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/)

---

## Feature 2 — Interview Prep Tab (Pro-only, Step 6)

### Recommended Approach
A new `InterviewPrepTab.tsx` added as Step 6. Pro-only. Takes the optimized resume text + job description already in memory — no new data collection. Calls Claude to generate 10–12 targeted interview questions with STAR guidance. Stream the output using the existing SSE pattern.

### Optimal Question Structure (Research-Backed)
Based on Harvard Business Review (2025) and InterviewTips.AI (2026):

- **10–12 questions total** — enough to be comprehensive, not so many it feels like homework
- **Mix**: 60% behavioral ("Tell me about a time when…"), 30% role-specific situational, 10% competency/values
- **Format per question**:
  ```
  Question → Category tag → STAR breakdown hint → Example answer skeleton
  ```
- **STAR weighting**: Situation 10-15%, Task 10-15%, Action 60-70%, Result remainder — tell users to spend most of their answer on what *they* did

### Backend Implementation

New endpoint: `POST /api/resume/interview-prep` (rate-limited, Pro-only)

```python
# Input schema (models/tools_models.py)
class InterviewPrepRequest(BaseModel):
    resume_text: str = Field(..., max_length=15000)
    job_description: str = Field(..., max_length=8000)
    job_title: str = Field("", max_length=200)

# Output: streamed SSE — same pattern as cover letter / LinkedIn
# Use Haiku for speed and cost; 10-12 questions fit in ~1200 tokens output
```

**System prompt approach** (use cache_control like the other prompts):
```
You are a senior hiring manager who has interviewed 500+ candidates for [job_title] roles.
Generate exactly 10 interview questions for a candidate applying to this role.
For each question output:
- The question (behavioral, situational, or role-specific — label it)
- A 2-sentence STAR coaching note (what specifically to include in S, T, A, R for THIS role)
- A one-sentence example answer opener to help the candidate start

Focus on the gap between what the JD requires and what the resume shows.
Weight behavioral questions 60%, situational 30%, values/culture 10%.
Do not generate generic questions. Every question must be specific to this role and company context.
```

### Streaming vs Block
**Stream it** — the existing SSE infrastructure handles this already. Interview questions take 15–25 seconds to generate at quality. Streaming makes it feel instantaneous. Render each question as it arrives, just as the cover letter does.

### Frontend Implementation
- Add `'interview'` to the `Tab` type in `shared.tsx`
- New `InterviewPrepTab.tsx` — same structure as `CoverLetterTab.tsx`
- Show a progress indicator while streaming: "Generating your interview questions…"
- Render each question in an expandable card: question visible by default, STAR guidance collapsed
- Add a "Copy all questions" button at the bottom

### Key Risks
- **Hallucinated company context**: If the JD doesn't mention the company name, Claude may invent one. Instruct the prompt to use "this company" or "this role" generically.
- **Generic output**: The main failure mode for interview prep AI. Mitigate by injecting specific skills gaps from the ATS scan — Claude can cross-reference what the JD lists vs. what the resume shows.
- **No storage needed for MVP** — generate on demand, don't store. Add a "Save to tracker" button later when the tracker exists.

### Estimated Effort
**1–2 days.** New endpoint + Pydantic model + system prompt + new tab component using existing SSE pattern.

### Resources
- [HBR — STAR Method (2025)](https://hbr.org/2025/02/use-the-star-method-to-land-your-next-job)
- [ApplyArc — STAR Examples](https://applyarc.com/blog/star-method-interview-examples)
- [Anthropic Prompting Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview)

---

## Feature 3 — Job Application Tracker

### Recommended Approach
A simple list-view tracker as a new page (`/tracker`), linked from the workspace Step 5 summary. Kanban view is a "nice to have" — add it later. Mobile-first list view is the right starting point given 60% of applications are submitted via mobile (CareerKit, 2025).

### Minimum Viable Schema

**Supabase table: `applications`**

```sql
CREATE TABLE applications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company     TEXT NOT NULL,
  role        TEXT NOT NULL,
  job_url     TEXT,
  date_applied DATE DEFAULT CURRENT_DATE,
  status      TEXT DEFAULT 'applied'
    CHECK (status IN ('saved','applied','phone_screen','interview','offer','rejected')),
  notes       TEXT,
  resume_scan_id UUID REFERENCES scan_results(id),  -- link to the scan used
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: users see only their own rows
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_applications" ON applications
  FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON applications TO authenticated;
```

**Essential fields** (from Jobshinobi 2026 analysis of 100+ tracker templates): company, role, status, date applied, notes, job URL. Everything else is optional.

**Status flow**: Saved → Applied → Phone Screen → Interview → Offer / Rejected

### Event Sourcing vs Overwrite
**Overwrite for MVP.** Simple `UPDATE applications SET status = $1 WHERE id = $2`. Event sourcing (logging every status change) is better for analytics but adds complexity. Add it at 200+ users when you have data worth analyzing. The `updated_at` timestamp gives you basic change tracking for free.

### Frontend Implementation

New page: `src/pages/TrackerPage.tsx` — linked from AppShell at `/tracker`

- **List view (default)**: table with Company, Role, Status pill, Date Applied, Notes icon, Actions
- **Status update**: inline dropdown — click status pill to change it
- **Add application**: "Log application" button pre-fills from the current workspace session if available
- **Mobile**: full-width cards stacked vertically, swipe-to-update status via a bottom sheet
- **Kanban view (deferred)**: add after launch. Use `@dnd-kit/core` (more actively maintained than react-beautiful-dnd which is unmaintained as of 2024)

### Key Risks
- **Scope creep**: Do not build reminders, email parsing, or auto-import from LinkedIn at MVP. A table with 6 fields and status updates is enough.
- **Resume version linking**: `resume_scan_id` links to the scan — users can see which resume version they used. Don't try to store the full resume text in the tracker table.
- **Free vs Pro**: Consider making basic tracking (10 applications) free and unlimited tracking Pro-only. Creates another conversion lever.

### Estimated Effort
**3–5 days.** Supabase table + RLS + 4 API endpoints (list, create, update, delete) + TrackerPage component.

### Resources
- [Supabase RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Jobshinobi — Tracker Schema Analysis](https://www.jobshinobi.com/blog/job-application-tracker-template-columns-to-include)
- [dnd-kit (Kanban library)](https://dndkit.com/)

---

## Feature 4 — Skills-First Resume Restructuring Toggle

### Recommended Approach
A toggle button in OptimizeTab: "Restructure for skills-first hiring." Pro-only. When enabled, sends the optimized resume through a second Claude call that adds a dedicated Skills / Core Competencies section after the Summary and before Experience — while preserving ALL work history in reverse chronological order.

**Critical distinction confirmed by research**: This is a **hybrid format** (skills section added), NOT a functional resume (which hides work history). Functional resumes fail ATS 58% of the time (StylingCV, 2026). The hybrid format is fully ATS-safe and aligns with 2026 skill-based hiring.

### 2026 Correct Section Order
Contact → Summary → **Skills / Core Competencies** → Work Experience (reverse chronological) → Education

This structure is confirmed by: Monster Resume Trends 2026, ResumeGuru 2026, LinkedIn Global Talent Trends 2025, and Sertifier's skills-based hiring research (2026). Cross-referenced across 4 independent sources — high confidence.

### ATS Impact
Hybrid format passes ATS. LinkedIn's 2025 Future of Recruiting report found 60%+ of US enterprise hiring teams now filter by specific skills before reviewing job history — meaning a clearly delineated skills section helps, not hurts, ATS scoring. Do NOT use a functional format (skills grouped by competency, no dates). That format fails Workday, Taleo, and Greenhouse.

### Backend Implementation

New endpoint: `POST /api/resume/skills-first` (Pro-only, rate-limited)

```python
class SkillsFirstRequest(BaseModel):
    optimized_resume_text: str = Field(..., max_length=15000)
    job_description: str = Field(..., max_length=8000)

# System prompt:
"""
You are a resume restructuring specialist. Your task is ONE specific change:

Add a "Core Competencies" or "Technical Skills" section IMMEDIATELY AFTER the Summary/Objective 
and BEFORE Work Experience. 

Rules:
- Extract skills already present in the resume (do not invent new ones)
- Group them into 3-5 categories relevant to the job description
- Preserve ALL work experience entries with their exact dates and bullet points
- Do not rewrite any bullet points — only move them if needed
- Return the COMPLETE restructured resume text
- The output must be at least 95% the length of the input
"""
```

### Frontend Implementation
- Add a "Restructure for skills-first ↗" toggle button in OptimizeTab after the optimized resume is shown
- Show a loading state while the Claude call runs (not streamed — short enough to block)
- Display a before/after tab selector: "Original structure" vs "Skills-first structure"
- Add a download button for the skills-first version

### Key Risks
- **Double-billing Claude**: This is a second Claude call after optimization. Use Haiku for cost efficiency (restructuring doesn't require Sonnet-level reasoning). Estimated cost: ~$0.003 per call.
- **Losing work history**: The main failure mode. The prompt must explicitly preserve all experience dates and bullets — test this thoroughly before shipping.
- **ATS variability**: Some older ATS systems (pre-2020 Taleo installations) may still penalize non-traditional formats. Add a disclaimer: "Recommended for modern ATS systems (Greenhouse, Lever, Workday 2022+)."

### Estimated Effort
**2–3 days.** New endpoint + Pydantic model + system prompt + UI toggle + before/after display.

### Resources
- [Interview Guys — Skills-Based Resume 2026](https://blog.theinterviewguys.com/how-to-write-a-skills-based-resume/)
- [StylingCV — Best Resume Format 2026 (ATS data)](https://stylingcv.com/blog/best-resume-format-2026-ats-friendly/)
- [Sertifier — Skill-Based Hiring 2026](https://sertifier.com/blog/skill-based-hiring-2026/)

---

## Feature 5 — Chrome Extension

### Recommended Approach
A Manifest V3 Chrome extension using **`activeTab` permission only** — the safest, most restrictive permission that still enables JD extraction. When the user clicks the extension icon on any job board page, a content script reads the visible page text, sends it to the extension popup, and the popup offers a "Send to AI Resume Studio" button that opens the workspace with the JD pre-filled.

### Architecture (Manifest V3)

```json
// manifest.json
{
  "manifest_version": 3,
  "name": "AI Resume Studio — JD Importer",
  "version": "1.0.0",
  "description": "Import any job description into AI Resume Studio in one click.",
  "permissions": ["activeTab", "scripting"],
  "action": { "default_popup": "popup.html" },
  "icons": { "48": "icon.png" }
}
```

**Data flow:**
1. User visits LinkedIn, Indeed, Greenhouse, or any job board
2. Clicks the extension icon → popup opens
3. Popup sends `chrome.scripting.executeScript` to extract visible text from the page
4. Extension parses out the job description (heuristic: largest text block, or the `<div>` with class containing "description" / "job-details")
5. User clicks "Import to AI Resume Studio" → opens `https://ai-resume-platform-hazel.vercel.app/?jd=<encoded text>` in a new tab
6. Frontend reads the `?jd=` query param on load and pre-fills the JD textarea in Step 1

```javascript
// content_script.js (injected on demand via scripting API)
function extractJobDescription() {
  // Try structured selectors first
  const selectors = [
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[data-testid*="job-description"]',
    '#job-details',
    '.description__text', // LinkedIn
    '.job-desc',          // Indeed
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.length > 200) return el.innerText.trim();
  }
  // Fallback: largest <p>/<div> block by text length
  return [...document.querySelectorAll('p, div')]
    .filter(el => el.children.length === 0)
    .sort((a, b) => b.innerText.length - a.innerText.length)[0]
    ?.innerText?.trim() ?? '';
}
```

### Why `activeTab` Is Enough (and Safer)
`activeTab` grants temporary DOM access only when the user explicitly clicks the extension icon. It does not request persistent access to all pages. This means:
- No `<all_urls>` or `host_permissions` — avoids triggering manual review
- Users are not exposed to the "This extension can read all your browsing data" warning that causes 50%+ of users to deny (Chrome permissions statistics, 2026)
- Approved faster — automated review track (under 24 hours) vs manual (up to 3 weeks)

### Chrome Web Store Submission
**Timeline**: 1–7 days typical; up to 3 weeks if manual review is triggered.

**To avoid manual review / rejection:**
1. Request ONLY `activeTab` and `scripting` — never `<all_urls>`
2. Include a Privacy Policy URL in the store listing (required — rejection if missing)
3. Submit test credentials in the "reviewer notes" field if login is required
4. No obfuscated code — Chrome's review system auto-rejects obfuscation
5. The extension description must exactly match what it does — "reads job description text from the current tab" is clear and accurate
6. Submit a demo video showing the extension in action

**Common rejection reasons** (67% of rejections are policy violations, 90% fail on functionality per ExtensionBooster, 2026):
- Missing privacy policy
- Requesting permissions broader than needed
- Broken functionality the reviewer can't test (no test credentials)
- Misleading store listing

### LinkedIn / ToS Consideration
**Reading page text via a browser extension is legally different from server-side scraping.** The extension runs in the user's browser, processing data the user has already loaded. LinkedIn's ToS specifically targets automated bots and server-side data collection — not browser extensions that help individual users interact with content they're viewing. Teal and Jobscan both have LinkedIn-compatible extensions operating without legal issues. That said: do not store or transmit the LinkedIn page content to your servers; only pass it to the user's own workspace session.

### Security Implications
- Content scripts run in the page's context but are isolated from the page's JavaScript — they cannot access the page's cookies or credentials
- The only data transmitted is the extracted job description text, passed as a URL parameter to your own app
- Do not request `cookies` or `storage` permissions — not needed and increases review scrutiny
- Add a Content Security Policy to the extension's `manifest.json`

### Estimated Effort
**2–3 weeks.** The extension itself is 2–3 days of code. The remaining time is Chrome Web Store review wait time + iteration if rejected. Plan for one rejection cycle. Build the frontend `?jd=` query param handling first (1 hour) so the extension has something to send to.

### Resources
- [Chrome Developers — Manifest V3 Content Scripts](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)
- [freeCodeCamp — Build a Chrome Extension MV3](https://www.freecodecamp.org/news/how-to-build-a-chrome-extension-using-javascript-and-manifest-v3/)
- [Chrome Web Store Review Process](https://developer.chrome.com/docs/webstore/review-process)
- [ExtensionBooster — Review Time Guide 2026](https://extensionbooster.net/blog/chrome-web-store-extension-review-time-2026-how-long-guide/)
- [Chrome Developers — Declare Permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)

---

## Summary Table

| Feature | Effort | Hardest Part | First Thing to Build |
|---------|--------|-------------|---------------------|
| Blurred preview | Half day | WCAG compliance on blur | `POST /api/resume/preview-optimize` with Haiku |
| Interview prep tab | 1–2 days | Prompt quality (avoid generic questions) | System prompt + test outputs manually first |
| Job tracker | 3–5 days | Schema design you won't regret | Supabase table + RLS SQL first |
| Skills-first toggle | 2–3 days | Preserving work history in Claude output | System prompt + test on 5 real resumes |
| Chrome extension | 2–3 weeks (review wait) | Web Store approval | `?jd=` query param handler in the frontend |

**Build order within a single sprint**: Preview → Interview prep → Skills-first → Tracker → Extension (Chrome extension last because of the Web Store wait).

---

*Research conducted July 2026. Sources: Chrome Developers, Supabase Docs, Qonversion, RevenueCat, HBR, InterviewTips.AI, ApplyArc, StylingCV, Sertifier, ExtensionBooster, freeCodeCamp, a11y-collective, Frontend Hero, Anthropic Prompt Engineering Docs.*
