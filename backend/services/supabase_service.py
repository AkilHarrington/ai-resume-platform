# =========================================================
# File: services/supabase_service.py
# Purpose:
# JWT verification + direct PostgREST calls to Supabase.
# Uses httpx for all DB operations — no Supabase Python SDK,
# no Pydantic V1 dependency, works on any Python version.
# =========================================================

import logging
import os
import httpx
import jwt as pyjwt
from jwt import PyJWKClient

logger = logging.getLogger("ai_resume_studio.supabase")

# Clear proxy env vars that cause httpx to try routing through unavailable SOCKS proxies.
for _proxy_var in ("ALL_PROXY", "all_proxy", "HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy"):
    os.environ.pop(_proxy_var, None)

# =========================================================
# JWKS client for RS256 JWT verification
# =========================================================

_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    """Singleton JWKS client — fetches Supabase's public keys once and caches them."""
    global _jwks_client
    if _jwks_client is None:
        supabase_url = os.getenv("SUPABASE_URL", "")
        _jwks_client = PyJWKClient(f"{supabase_url}/auth/v1/.well-known/jwks.json")
    return _jwks_client


# =========================================================
# Direct PostgREST helpers — no Supabase SDK, no Pydantic
# =========================================================

def _db_headers() -> dict:
    """
    Headers for PostgREST (Supabase REST API) calls using the new sb_secret_* key format.

    Supabase's API Gateway translates the `apikey: sb_secret_*` header into a
    short-lived service_role JWT before forwarding to PostgREST — so we only need
    to set the `apikey` header. DO NOT put the key in Authorization: Bearer; the
    gateway rejects non-JWT values there.

    Requires SUPABASE_SERVICE_KEY env var set to the sb_secret_* value from
    Supabase Dashboard → Settings → API Keys → Secret keys.
    """
    service_key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not service_key:
        raise RuntimeError("SUPABASE_SERVICE_KEY not set — cannot authenticate with Supabase DB.")
    return {
        "apikey": service_key,
        "Content-Type": "application/json",
    }


def _db_url(table: str) -> str:
    return f"{os.getenv('SUPABASE_URL', '')}/rest/v1/{table}"


# =========================================================
# JWT verification
# =========================================================

def verify_token(token: str) -> dict | None:
    """
    Verify a Supabase JWT locally — supports both HS256 (legacy secret) and RS256 (JWKS).
    No network call to Supabase auth API — pure local crypto.
    """
    try:
        header = pyjwt.get_unverified_header(token)
        alg = header.get("alg", "RS256")

        if alg == "HS256":
            jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "")
            if not jwt_secret:
                logger.error("SUPABASE_JWT_SECRET not set — cannot verify HS256 tokens.")
                return None
            decoded = pyjwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
            decoded = pyjwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256", "ES256"],
                options={"verify_aud": False},
            )

        user_id = decoded.get("sub")
        email = decoded.get("email")
        if not user_id:
            logger.debug("verify_token: JWT missing 'sub' claim")
            return None
        return {"id": user_id, "email": email}

    except pyjwt.ExpiredSignatureError:
        logger.debug("verify_token: token expired")
        return None
    except pyjwt.InvalidTokenError as e:
        logger.warning("verify_token failed: %s", type(e).__name__)
        return None
    except Exception as e:
        logger.warning("verify_token failed unexpectedly: %s", type(e).__name__)
        return None


# =========================================================
# Database operations — direct httpx to PostgREST
# =========================================================

def get_user_pro_status(user_id: str, user_jwt: str | None = None) -> bool:
    """
    Return True if the user has an active Pro subscription.
    Returns False if no profile row exists yet.
    Raises on genuine infrastructure failures (non-2xx, non-empty response).

    When user_jwt is provided, uses the anon (publishable) key + user's own JWT.
    This bypasses the sb_secret_* → gateway → JWT translation chain and uses
    PostgREST's standard RLS auth path — the most reliable approach.

    Falls back to service key (apikey only) when no user JWT is available.
    """
    try:
        if user_jwt:
            # Preferred path: anon key + user JWT. PostgREST verifies the JWT
            # via JWKS just like any user request, no gateway translation needed.
            anon_key = os.getenv("SUPABASE_ANON_KEY", "")
            if not anon_key:
                # Anon key not set — fall through to service key path below
                headers = _db_headers()
            else:
                headers = {
                    "apikey": anon_key,
                    "Authorization": f"Bearer {user_jwt}",
                    "Content-Type": "application/json",
                }
        else:
            headers = _db_headers()

        resp = httpx.get(
            _db_url("profiles"),
            headers=headers,
            params={"select": "is_pro", "id": f"eq.{user_id}"},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            if not data:
                logger.info("get_user_pro_status: no profile row for %s — treating as free.", user_id)
                return False
            return bool(data[0].get("is_pro", False))
        raise RuntimeError(f"Supabase DB returned {resp.status_code}: {resp.text[:200]}")
    except httpx.TimeoutException:
        raise RuntimeError("Supabase DB timeout")


def set_user_pro(user_id: str, stripe_customer_id: str = "", stripe_subscription_id: str = "") -> None:
    """Flip is_pro=true for a user after successful Stripe payment."""
    resp = httpx.post(
        _db_url("profiles"),
        headers={**_db_headers(), "Prefer": "resolution=merge-duplicates"},
        json={
            "id": user_id,
            "is_pro": True,
            "stripe_customer_id": stripe_customer_id,
            "stripe_subscription_id": stripe_subscription_id,
        },
        timeout=10,
    )
    if resp.status_code not in (200, 201):
        logger.error("set_user_pro failed for %s: %s %s", user_id, resp.status_code, resp.text[:200])


def revoke_user_pro(stripe_customer_id: str) -> None:
    """Flip is_pro=false when a Stripe subscription is cancelled."""
    resp = httpx.patch(
        _db_url("profiles"),
        headers=_db_headers(),
        params={"stripe_customer_id": f"eq.{stripe_customer_id}"},
        json={"is_pro": False},
        timeout=10,
    )
    if resp.status_code not in (200, 204):
        logger.error("revoke_user_pro failed for customer %s: %s", stripe_customer_id, resp.status_code)


def log_scan_result(
    user_id: str | None,
    scan_type: str,
    before_score: int,
    after_score: int,
    missing_keywords: list[str],
    matched_keywords: list[str],
    semantic: bool = True,
    job_category: str = "",
) -> None:
    """Log a scan or optimize result for analytics. Fails silently — never blocks the user."""
    try:
        httpx.post(
            _db_url("scan_results"),
            headers=_db_headers(),
            json={
                "user_id": user_id or None,
                "scan_type": scan_type,
                "job_category": job_category or None,
                "before_score": before_score,
                "after_score": after_score,
                "score_improvement": after_score - before_score,
                "missing_keywords": missing_keywords,
                "matched_keywords": matched_keywords,
                "keyword_count_missing": len(missing_keywords),
                "keyword_count_matched": len(matched_keywords),
                "semantic": semantic,
            },
            timeout=10,
        )
    except Exception as e:
        logger.warning("log_scan_result failed (non-blocking): %s", type(e).__name__)


def get_user_by_email(email: str) -> dict | None:
    """Look up a profile by email (used for webhook matching)."""
    try:
        resp = httpx.get(
            _db_url("profiles"),
            headers=_db_headers(),
            params={"select": "id,email,is_pro", "email": f"eq.{email}"},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            return data[0] if data else None
        return None
    except Exception as e:
        logger.warning("get_user_by_email failed: %s", type(e).__name__)
        return None
