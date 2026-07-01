# AI Resume Studio — Feature Roadmap 2026
*Research-backed. Cross-referenced. Ranked by multi-source user demand.*

---

## Context: What the Data Shows About the Market Right Now

- **83–98% of Fortune 500 companies** use AI to screen resumes (ResumeBuilder survey, Oct 2024; JobCannon 2026)
- **87% of employers** now use skills-based hiring, up from 40% in 2020 — meaning resume structure is changing (Sertifier, 2026)
- **58% of Fortune 500** have dropped degree requirements — skills sections now outrank education (LinkedIn Global Talent Trends, 2025)
- The average successful job search requires **100–200 applications** (NBER, 2025) — users are in this for weeks or months, not days
- Candidates who do structured interview prep are **33% more likely to receive an offer** (Glassdoor Hiring Survey, 2025)
- The "best AI interview coach" search term **tripled in volume** since 2025 (InterviewSidekick, 2026)

---

## Ranked Feature List

### #1 — Optimization Preview for Free Users *(Conversion — build immediately)*

**The case:** The biggest leaky bucket in any freemium SaaS is free users who scan, see their score, and leave without upgrading. Right now the pro gate is just an UpgradePrompt box — nothing shows the user *what they'd get*. The fix: show a real (but blurred or truncated) preview of the first 3 optimized bullets beneath the pro gate so users can see the quality of the output before paying.

The evidence for this is strong and consistent across sources. Stockpress doubled free-to-paid conversion (10% → 25%) by exposing users to premium features before gating them (GTM Strategist, 2025). RevenueCat's 2025 State of Subscription Apps report shows hard paywalls convert at 12.11% median vs. 2.18% for pure freemium — the difference is perceived value before the ask. Systematic A/B testing of in-product upgrade moments shows a median 12–18% uplift (Optimizely, 2025). This is the highest-ROI change you can make to the existing product with zero new infrastructure.

**Implementation:** After the ATS scan, call the optimizer for the first 3 bullets only, show them partially blurred in the UI, and gate the full version behind Pro. One afternoon of work.

**Competitors:** None of the major tools (Jobscan, Teal, Rezi) do this well. Teal shows a locked "AI Suggestions" panel; Jobscan shows a score and stops. The blurred preview is a differentiated UX moment.

---

### #2 — Interview Prep Tab *(Retention + Pro upsell — build next)*

**The case:** After a user optimizes their resume for a specific role, the natural next question is *"how do I prep for the interview?"* No major resume tool currently completes this loop — it's a gap confirmed across multiple sources. Jobscan users explicitly complain the tool "stops at the resume and doesn't help you prepare for the interview that follows" (FutuRole, 2026). Teal has zero interview prep. Rezi has none. This is a white space.

The demand data is unambiguous: the "best AI interview coach" search tripled since 2025 (InterviewSidekick), 33% more offers go to candidates who use structured prep (Glassdoor, 2025), and the average job seeker spends only 33 minutes preparing for an interview despite it being the highest-leverage activity in the job search (Indeed, 2025). The market for standalone AI interview prep tools is crowded (FinalRoundAI, InterviewSidekick, CleverPrep), but *none of them* are integrated into the resume optimization flow. You already have the resume and the JD — Claude can generate highly targeted STAR-method questions in seconds.

**Implementation:** A Pro-only Step 6 tab. Takes the optimized resume + JD already in memory, calls Claude to generate 10–15 role-specific interview questions with STAR-method answer frameworks. Stream the output for speed. Zero new data storage required.

**Differentiation:** Tools like ApplyArc already generate "role-specific STAR method answers with follow-up questions based on the actual job description" (ApplyArc, 2026) — but as a standalone product. You have the resume context they don't.

---

### #3 — Job Application Tracker *(Retention — build at 50+ users)*

**The case:** This is the most-mentioned missing feature across all competitor reviews. Jobscan users say the platform "doesn't track your applications with reminders" (FutuRole, 2026). Teal's job tracker is praised as its best feature — it's the *main* reason users stay subscribed even when they're unhappy with the AI writing quality (Trustpilot, Rezi review of Teal, 2026). The average successful job search takes 100–200 applications (NBER, 2025), meaning users are in your product for weeks. Without a tracker, they have no reason to return after the first optimization session.

A simple tracker — job title, company, date applied, status (Applied / Interview / Offer / Rejected), and a link back to the optimized resume version — creates daily active usage where you currently have one-time sessions. 60% of job applications are now submitted via mobile (CareerKit, 2025), so mobile-responsiveness matters here.

**Why not now:** This is more than a weekend build. Wait until you have 50+ users so you know which fields they actually want before you design the schema.

---

### #4 — JD Text Extraction from URL *(UX — build carefully)*

**The case:** Users who paste job description URLs instead of text is a real friction point, but the solution requires care. **Direct scraping of LinkedIn and Indeed is legally risky** — LinkedIn sued Proxycurl in January 2025 and the service shut down entirely; Indeed's ToS also prohibits scraping (Cavuno, 2026; DEV Community, 2026). The CFAA (Computer Fraud and Abuse Act) doesn't reliably protect against ToS-based lawsuits, and LinkedIn has demonstrated willingness to litigate.

The safe path: accept a URL, fetch the raw HTML server-side using a public proxy or headless browser service (Apify, Browse.ai), extract the visible text, and strip boilerplate. This works reliably for Greenhouse, Lever, Workday, and Ashby career pages — which power thousands of company job boards and have no scraping prohibition. For LinkedIn and Indeed, show a clear message: *"We can't import from LinkedIn directly — paste the job description text instead."*

**Competitor handling:** All major tools (Teal, Careerflow, JobOwl, ResumeWorded, Huntr) currently require manual copy/paste. Nobody has solved this cleanly. Being first to do it safely is a real differentiator.

**Risk note:** Do not attempt LinkedIn or Indeed scraping in production. Flag it as "coming soon" and build for ATS career pages first.

---

### #5 — Skills-First Resume Restructuring *(Feature depth — build at 100+ users)*

**The case:** 87% of employers now use skills-based hiring (Sertifier, 2026), 58% of Fortune 500 dropped degree requirements (LinkedIn, 2025), and the new dominant resume structure is: Contact → Summary → Skills → Experience → Education (ResumeGuru, 2026; Monster, 2026). Your optimizer currently rewrites bullets but preserves section order. A "restructure for skills-first" toggle — surfacing the skills section above experience — would directly address what 2026 hiring managers are screening for.

**Cross-reference:** This appears in two independent sources (Monster's Resume Trends 2026 and Sertifier's skills-based hiring report) and aligns with LinkedIn's 2025 Global Talent Trends data. Confidence is high.

---

### #6 — Chrome Extension *(Growth + UX — build at 200+ users)*

**The case:** Teal's most-praised feature is its Chrome extension for saving job listings (Trustpilot, 2026; Rezi review of Teal, 2026). With a Chrome extension, you can: (a) one-click extract JD text from any job board page safely (no server-side scraping needed — the user's browser does the reading), (b) pre-fill the JD field without leaving the job posting, and (c) show a "Scan my resume for this job" button on any job page. This is the safest solution to the URL scraping problem and the highest-leverage growth mechanism at scale.

**Why not now:** Extensions require Chrome Web Store approval, maintenance across browser updates, and a separate codebase. Build the core product first.

---

## What the Research Flagged That You're Already Doing Right

- **Anti-hallucination:** The category-wide #1 complaint about AI resume tools is fabricated metrics and invented technologies (Hirecarta, 2026). Your hallucination check (blocking named tool insertion) is a genuine differentiator — market it explicitly.
- **Human-sounding output:** Every review of Teal, Rezi, and Jobscan mentions AI-generic writing as a top complaint. Your anti-buzzword prompt is solving the right problem.
- **Semantic ATS scoring vs. keyword stuffing:** Jobscan's "One-Click Optimize" is criticized for "keyword stuffing that inflates match scores but reads poorly" (ResumeJudge, 2026). Your approach is the opposite. This is worth calling out in your marketing.

---

## What to Ignore (For Now)

- **Video resumes:** Searched across all sources — no evidence of meaningful employer adoption in 2026. Still niche (creative/media roles only). ❌
- **Auto-apply / batch apply:** Legally grey, ToS-violating on most platforms, and produces spam-quality applications. Teal explicitly doesn't offer it for this reason. ❌
- **LinkedIn import:** LinkedIn's API access is heavily restricted. Not viable without an official partnership. ❌

---

## Recommended Build Order

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | Optimization preview (blurred) for free users | Half day | Immediate conversion lift |
| 2 | Interview prep tab (Step 6, Pro-only) | 1–2 days | Strong Pro retention + upsell |
| 3 | JD URL extraction (non-LinkedIn/Indeed) | 2–3 days | UX friction reduction |
| 4 | Job application tracker (simple) | 1 week | Daily retention at 50+ users |
| 5 | Skills-first restructuring toggle | 2–3 days | 2026 hiring format alignment |
| 6 | Chrome extension | 2–3 weeks | Scale play at 200+ users |

---

*Research conducted July 2026. Sources: G2, Trustpilot, Rezi Blog, ResumeGenius, FutuRole, ATSVerification, RevenueCat, GTM Strategist, Glassdoor Hiring Survey 2025, Indeed, Sertifier, Cavuno, DEV Community, InterviewSidekick, ApplyArc, Huntr Q2 2025 Research, NBER 2025, LinkedIn Global Talent Trends 2025, Optimizely 2025, JobCannon 2026.*
