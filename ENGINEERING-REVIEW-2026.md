# AI Resume Studio — Senior Engineering Review

**Date:** June 15, 2026
**Reviewer scope:** Security, code quality, architecture, scalability, pre-deploy (Render + Vercel)
**Method:** Read backend + frontend in full; benchmarked findings against current (2026) standards for FastAPI security, Supabase JWT verification, Stripe webhooks, SSE streaming, slowapi rate limiting, and React/Vite frontend security. Several findings were empirically verified in a sandbox (Stripe SDK namespace, ReportLab parsing, JWT decode).

Items already listed in your "What's been done" set are not re-flagged. Everything below is new or expands on a gap.

---

## CRITICAL

### C1 — Real Supabase `service_role` key is committed to the repo
**File:** `backend/.env.example` (git-tracked)

`.env.example` contains a live `SUPABASE_URL` and a real `SUPABASE_SERVICE_KEY`. I decoded the JWT:

```
{'iss':'supabase','ref':'zcvznubsxfztbwkhwrur','role':'service_role','iat':1781309822,'exp':2096885822}
```

This is a `service_role` key — it **bypasses Row Level Security and has full read/write to your entire database** — and it does not expire until the year 2036+ (`exp` 2096885822). `.gitignore` excludes `.env` and `backend/.env`, but `*.env.example` is intentionally committed, so this key is in your git history right now. If this repo is ever pushed to GitHub (even private, even briefly) the database is fully compromised. The 2026 Supabase guidance is explicit: secret/service keys must never be in source control, and you should move backends off `service_role` onto scoped secret keys.

**Fix (do today, before any other work):**
1. Rotate the key in Supabase dashboard immediately (the committed one is burned).
2. Replace the value in `.env.example` with a placeholder (`SUPABASE_SERVICE_KEY=your_service_key_here`) and remove the real `SUPABASE_URL` too.
3. Scrub git history (`git filter-repo` or BFG) so the old key isn't recoverable from prior commits.
4. Migrate the backend to a Supabase **secret key** (sb_secret_…) rather than the legacy `service_role` JWT — secret keys can be rotated per-service and return 401 if leaked to a browser.

---

### C2 — Auth verification does a network round-trip to Supabase on *every* request — twice
**Files:** `backend/services/supabase_service.py:36-49` (`verify_token`), `backend/main.py:110-117` (`_user_or_ip_key`), `main.py:178-187` (`get_current_user`)

`verify_token` calls `client.auth.get_user(token)`, which is a live HTTP call to the Supabase Auth server to validate the JWT. This is invoked:
- once in the **rate-limiter key function** (`_user_or_ip_key`, runs on every limited route), and
- again in **`get_current_user`** (the auth dependency), and then
- `require_pro` adds a **third** Supabase call via `get_user_pro_status`.

So a single Pro action (e.g. `/api/resume/optimize/stream`) makes **3 sequential network calls to Supabase before any work starts**, two of which validate the identical token. The 2026 standard is to verify Supabase JWTs **locally** using the project's asymmetric signing keys (JWKS discovery endpoint) — zero network calls, microsecond verification, and keys are rotatable without redeploy.

**Impact at scale:** at 1k users this adds latency and cost; at 10k it makes Supabase Auth your bottleneck and single point of failure — if Auth rate-limits or slows, your entire API stalls. This is the single biggest thing that "breaks under load."

**Fix:**
- Verify the JWT locally with `python-jose`/`PyJWT` against Supabase's JWKS (`/.well-known/jwks.json`) or the JWT secret. Cache the JWKS.
- Have the rate-limiter key function reuse the already-decoded claims instead of re-verifying — decode once per request, attach to `request.state`.
- Consider caching pro-status (short TTL, e.g. 30–60s) so it isn't a DB hit on every gated call.

---

## HIGH

### H1 — Stripe webhook error handling references a namespace that doesn't exist → every verification failure 500s
**File:** `backend/main.py:713-725`

```python
except stripe.errors.SignatureVerificationError:   # line 720
```

`stripe` 11.4.0 (your pinned version) has **no `stripe.errors` attribute** — it's `stripe.error` (singular) or the top-level `stripe.SignatureVerificationError`. I verified this in a sandbox: when `construct_event` raises (bad signature *or* malformed payload), evaluating the `except stripe.errors.…` clause itself throws `AttributeError: module 'stripe' has no attribute 'errors'`, which **escapes the handler entirely** — the generic `except Exception` below it never runs.

Net effect: the happy path (valid signature) works, but **any** invalid/forged/malformed webhook returns a 500 instead of the intended 400. That means Stripe treats forged events as "failed" and retries them on its 72-hour backoff schedule, your logs fill with 500s, and the one branch you wrote to return a clean 400 is dead. It also proves this error path was never tested. In payment code, that's a HIGH.

**Fix:** `except stripe.SignatureVerificationError:` (top-level, exists in v11) and `except ValueError:` for payload errors. Add a unit test that posts a bad-signature body and asserts 400.

### H2 — Stripe webhook has no idempotency and silently drops un-matched payments
**File:** `backend/main.py:713-761`

Two problems in the same handler:

1. **No idempotency key.** Stripe guarantees *at-least-once* delivery and retries for 72h, so the same `event.id` will arrive more than once. `checkout.session.completed` is processed every time with no dedup, so `set_user_pro` runs repeatedly (and any future side effects — emails, etc. — would double-fire). The 2026 standard is to persist each `event.id` in a table with a UNIQUE constraint and short-circuit if seen.
2. **Payment can succeed without granting Pro, with no retry.** Pro is granted only if `get_user_by_email(customer_email)` finds a profile (line 734). If the profile isn't found — webhook arrives before the signup trigger fires, or the Stripe checkout email differs in case/spelling from the signup email — you log a warning and return `{"received": True}` (200). Stripe sees success and never retries, so **the customer paid and never got Pro.**

**Fix:**
- Set `client_reference_id=user["id"]` (and/or `metadata`) when creating the checkout session (see H3), then resolve the user by that stable ID in the webhook instead of email.
- Add an `processed_stripe_events(event_id PK)` table; insert-or-skip at the top of the handler.
- If the user truly can't be resolved, return a non-2xx so Stripe retries, or enqueue for reconciliation.

### H3 — Checkout session ties payment to a mutable email, and the endpoint is unauthenticated against abuse
**File:** `backend/main.py:675-691`

`create_checkout_session` passes only `customer_email=user.get("email")` and relies on email-matching downstream (H2). It does **not** set `client_reference_id`/`metadata` with the Supabase user id — the one stable identifier. Separately, this is the **only** mutating endpoint with **no `@limiter.limit`**, so an authenticated user can spam Stripe session creation.

**Fix:** add `client_reference_id=user["id"]`, and add a rate limit (e.g. `@limiter.limit("10/minute")`).

### H4 — slowapi uses in-memory storage → rate limits don't work in production on Render
**File:** `backend/main.py:119` (`Limiter(key_func=_user_or_ip_key)` — no `storage_uri`)

slowapi defaults to per-process in-memory counters. Render runs your app behind multiple Uvicorn workers and/or multiple instances; each has its own counter, so a `5/minute` limit effectively becomes `5 × workers × instances`. This is a well-documented slowapi limitation. Your abuse/cost protection (Anthropic spend!) silently degrades the moment you scale past one worker.

**Fix:** point slowapi at Redis: `Limiter(key_func=…, storage_uri=os.getenv("REDIS_URL"))`. Render offers managed Redis; this is a few lines.

### H5 — SSE streams and sync handlers share one bounded thread pool → exhaustion under modest load
**Files:** `backend/main.py` streaming endpoints (`393`, `542`, `585`) and all `def` handlers (`315`, `329`, `524`, `570`, `625`, `647`)

The streaming endpoints are `async def` but return `StreamingResponse(generate())` where `generate` is a **synchronous** generator that calls blocking Anthropic streaming. Starlette iterates sync generators in the AnyIO worker thread pool (default ~40 threads), and your other heavy endpoints (`scan`, `upload`, `cover-letter`, PDF) are also sync `def` and run in that **same** pool. A single resume optimize holds a thread for the entire Claude generation (tens of seconds). The 2026 SSE-at-scale guidance is blunt: each streaming LLM request pins a worker for its full duration; once concurrent streams exceed the pool, *everything* queues — including health checks, which makes Render mark the instance unhealthy.

**Impact:** ~40 concurrent long operations stalls the whole instance. That's well within reach at 1k active users.

**Fix:** make the streaming generators truly async (`async def generate()` using the Anthropic async client and `async for`), so they ride the event loop instead of threads. Raise the AnyIO thread-pool limit as a stopgap. Longer term, offload non-streaming Claude work (scan, cover-letter, LinkedIn) to a queue (Celery/RQ) and keep web workers thin. Ensure Render's proxy doesn't buffer SSE (you already send `X-Accel-Buffering: no` — good; confirm Render honors it).

### H6 — Unescaped resume text fed into ReportLab `Paragraph` → PDF generation 500s on ordinary resumes
**File:** `backend/services/pdf_service.py` (39 `Paragraph(...)` calls, e.g. lines 182, 212, 376, 382, 438; entry points 623-663 in `main.py`)

ReportLab's `Paragraph` parses a mini-HTML markup, and user-derived text (summary, bullets, names, cover-letter body) is passed in **without escaping**. I verified in a sandbox (reportlab 4.4.10) that realistic content throws `ValueError`:

```
'Built A<B comparison'      -> ValueError: parse ended with unclosed tags
'Scaled to >10k users <fast'-> ValueError: unclosed tags
'Used <font> tag'           -> ValueError: Parse error
```

Any resume containing a `<` that the parser reads as a tag (and Claude-optimized text can easily produce these) makes `/api/resume/download-pdf` return 500. Since the whole point of the product is downloading the optimized resume, this is a HIGH reliability bug.

**Fix:** run every user string through `xml.sax.saxutils.escape()` (escaping `&`, `<`, `>`) before constructing each `Paragraph`. Wrap it in one `_p(text)` helper and route all Paragraph text through it.

---

## MEDIUM

### M1 — Semantic ATS Anthropic client has no timeout
**File:** `backend/services/semantic_ats_service.py:45`

`anthropic.Anthropic(api_key=api_key)` is created with no `timeout`, unlike `resume_service.py:35-38` which correctly sets `httpx.Timeout(120.0, connect=10.0)`. The Anthropic default is 10 minutes. A hung Haiku scoring call can pin a thread-pool worker (see H5) for up to 600s. Apply the same 120s timeout here.

### M2 — `/health` doesn't check real dependencies
**File:** `backend/main.py:293-306`

It only checks env-var *presence*, not connectivity. On Render, a health check that passes while Supabase or Anthropic is down means the load balancer keeps routing to a broken instance. Add a lightweight, cached real check (e.g. a cheap Supabase `select 1` with a short timeout), and separate "liveness" (process up) from "readiness" (deps reachable).

### M3 — Hot-path Supabase writes block the user response
**Files:** `backend/main.py:357-365` (scan) and `478-486` (optimize); `supabase_service.py:94-121` (`log_scan_result`)

`log_scan_result` is a synchronous Supabase insert executed inline before the response returns, on every scan and optimize. It's wrapped to fail silently, but it still adds a network round-trip of latency to the user-facing path and consumes a thread. Make analytics logging fire-and-forget (background task / queue).

### M4 — Subscription lifecycle is incomplete (dunning / refunds / disputes)
**File:** `backend/main.py:745-757`

You handle `customer.subscription.deleted` but not `invoice.payment_failed` (card declines on renewal — user keeps Pro until Stripe finally deletes), `charge.refunded`/`charge.dispute.created` for the one-time $49 plan (refunded buyers keep Pro forever, since one-time payments never emit `subscription.deleted`). Decide a policy and handle at least payment failure and refund.

### M5 — Client-supplied scores are trusted
**Files:** `backend/models/optimize_models.py:12-13`, `backend/main.py:402-414`

`existingScore` and `existingKeywords` come from the client and are used directly as the "before" score and fed into logged analytics and the displayed improvement. A user can post `existingScore: 10` to manufacture a dramatic "before/after." Low real-world harm (it's their own resume, cosmetic), but it pollutes your `scan_results` analytics and the credibility-cap logic. Treat client scores as hints to re-validate, or drop them server-side for logging.

### M6 — Supabase session (JWT) persisted in `localStorage`
**Files:** `frontend-app/src/services/supabase.ts:6` (default `persistSession`/`autoRefreshToken`)

Supabase-js stores the access + refresh token in `localStorage` by default, which is readable by any XSS. You're reasonably protected today (React auto-escapes, I found no `dangerouslySetInnerHTML`), but it's the highest-value target if any XSS slips in, and the 2026 guidance favors httpOnly-cookie or in-memory storage for access tokens. At minimum: keep dependencies audited, never introduce `dangerouslySetInnerHTML` without DOMPurify, and consider the SSR/cookie auth helper if you ever add a Next.js layer. Document the tradeoff.

### M7 — Business logic lives inside route handlers; thin test coverage on the risky parts
**Files:** `backend/main.py:393-515` (the entire optimize pipeline is inline in the handler); `backend/tests/` (only `test_score_logic.py`)

The optimize endpoint mixes transport (SSE), orchestration (scoring, retries, capping), and persistence in one 120-line generator — hard to unit test, which is why the scoring fallback logic is untested. Your 26 tests cover score math but not auth, webhook signature handling (H1!), upload validation, or pro-gating. Extract the pipeline into a service function and add tests for the webhook and auth paths specifically.

---

## LOW

- **L1 — Dead code.** `optimize_resume_text` and `build_resume_optimization_prompt` (`resume_service.py:278-343, 176-275`) are the non-streaming optimize path; no endpoint calls them (only `stream_resume_optimization` is wired). `main.py:30` imports `optimize_resume_text` unused. Remove to cut maintenance surface and prompt drift (two copies of the same 100-line prompt can diverge).
- **L2 — `allow_credentials=True` is unnecessary.** `main.py:148`. You authenticate via `Authorization` header, not cookies; setting credentials true with an explicit origin list is harmless but misleading. Drop it.
- **L3 — `frontend-app/.env` is not git-ignored.** `.gitignore` covers `.env` and `backend/.env` but not `frontend-app/.env`. It currently holds only public `VITE_` values (anon key, publishable key — safe by design), but add it to `.gitignore` to prevent an accidental future secret commit.
- **L4 — Redundant branch.** `main.py:471`: `15 if original_score < 60 else (15 if original_score < 75 else 12)` — first two arms are identical. Simplify to `15 if original_score < 75 else 12`.
- **L5 — Wasted retry on a deterministic call.** `main.py:445-447`: when the semantic re-score returns 0, you retry the *identical* `semantic_ats_score` call with `temperature=0` — same input, same output, just double cost/latency. If 0 means a parse/transport failure, retrying the same call rarely helps; vary something or fall straight to the keyword-diff estimate.
- **L6 — Duplicate banned-phrase lists.** `resume_service.py:42-50` (`BANNED_PHRASES`) and the inlined list in `OPTIMIZER_SYSTEM_PROMPT:78-82` must be kept in sync by hand. Generate the prompt text from the constant.

---

## Prioritized fix list (by deploy risk)

**Block deploy — do before anything ships:**
1. **C1** — Rotate the leaked Supabase `service_role` key, scrub it from `.env.example` and git history, move to a scoped secret key.
2. **H1** — Fix the `stripe.errors` → `stripe.SignatureVerificationError` crash; add a bad-signature test.
3. **H2 / H3** — Switch webhook matching to `client_reference_id`, add `event.id` idempotency, return non-2xx (or queue) on unresolved users, rate-limit the checkout endpoint. (Otherwise: paid users with no Pro, and double-processing.)
4. **H6** — Escape user text before ReportLab `Paragraph`; PDF download currently 500s on ordinary resumes.

**Before real traffic (1k+ users):**
5. **C2** — Verify Supabase JWTs locally (JWKS), stop the 2–3 Auth round-trips per request, cache pro-status.
6. **H4** — Move slowapi to Redis so limits survive multiple Render workers/instances.
7. **H5** — Make streaming generators async; offload non-streaming Claude work; protect the thread pool.
8. **M1** — Add the missing Anthropic timeout in the semantic scorer.
9. **M2** — Real dependency health check for Render.

**Hardening / cleanup (post-launch, soon):**
10. **M3** analytics off the hot path · **M4** dunning/refund webhooks · **M5** stop trusting client scores · **M6** localStorage token tradeoff documented · **M7** extract the optimize pipeline + tests for webhook/auth/upload.
11. **L1–L6** dead code, CORS credentials, gitignore, redundant branches, wasted retry, duplicated prompt list.

---

### Bottom line
Architecture and prior hardening are genuinely strong for a solo non-technical founder — the auth-dependency pattern, server-side pro gate, structured errors, and input caps are all correct. The blockers are concentrated in two places: **one leaked secret (C1)** and **the payment webhook (H1–H3)**, both of which are existential for a paid product. The scalability items (C2, H4, H5) won't bite on day one but will absolutely surface as you grow, and they're cheaper to fix now than after launch. Fix the four "block deploy" items this week and you're in good shape to ship.
