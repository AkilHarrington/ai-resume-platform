# =========================================================
# File: services/supabase_service.py
# Purpose:
# Supabase client + helpers for user pro status.
# =========================================================

import logging
import os
from supabase import create_client, Client

logger = logging.getLogger("ai_resume_studio.supabase")

# Clear proxy env vars that cause httpx (used by the Supabase client) to try routing
# through a SOCKS proxy that isn't available in the local dev environment.
for _proxy_var in ("ALL_PROXY", "all_proxy", "HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy"):
    os.environ.pop(_proxy_var, None)

# =========================================================
# Singleton client — instantiated once, reused across requests
# =========================================================

_client: Client | None = None


def _get_client() -> Client:
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_KEY", "")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.")
        _client = create_client(url, key)
    return _client


def verify_token(token: str) -> dict | None:
    """Verify a Supabase JWT and return {id, email}, or None if invalid."""
    try:
        client = _get_client()
        response = client.auth.get_user(token)
        user = response.user
        if not user:
            logger.debug("verify_token: get_user returned no user")
            return None
        return {"id": user.id, "email": user.email}
    except Exception as e:
        # Log type only — token value must never appear in logs
        logger.warning("verify_token failed: %s", type(e).__name__)
        return None


def get_user_pro_status(user_id: str) -> bool:
    """
    Return True if the user has an active Pro subscription.

    Raises RuntimeError on connection/infrastructure failures so callers can
    distinguish "user is not Pro" from "we couldn't check" — preventing paying
    users from being locked out during Supabase outages.
    """
    client = _get_client()
    result = client.table("profiles").select("is_pro").eq("id", user_id).single().execute()
    return bool(result.data.get("is_pro", False))


def set_user_pro(user_id: str, stripe_customer_id: str = "", stripe_subscription_id: str = "") -> None:
    """Flip is_pro=true for a user after successful Stripe payment."""
    client = _get_client()
    client.table("profiles").upsert({
        "id": user_id,
        "is_pro": True,
        "stripe_customer_id": stripe_customer_id,
        "stripe_subscription_id": stripe_subscription_id,
    }).execute()


def revoke_user_pro(stripe_customer_id: str) -> None:
    """Flip is_pro=false when a Stripe subscription is cancelled."""
    client = _get_client()
    client.table("profiles").update({"is_pro": False}).eq(
        "stripe_customer_id", stripe_customer_id
    ).execute()


def log_scan_result(
    user_id: str | None,
    scan_type: str,  # 'scan' or 'optimize'
    before_score: int,
    after_score: int,
    missing_keywords: list[str],
    matched_keywords: list[str],
    semantic: bool = True,
    job_category: str = "",
) -> None:
    """Log a scan or optimize result for analytics. Fails silently — never blocks the user."""
    try:
        client = _get_client()
        client.table("scan_results").insert({
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
        }).execute()
    except Exception as e:
        logger.warning("log_scan_result failed (non-blocking): %s", type(e).__name__)


def get_user_by_email(email: str) -> dict | None:
    """Look up a profile by email (used for webhook matching)."""
    try:
        client = _get_client()
        result = client.table("profiles").select("id, email, is_pro").eq("email", email).single().execute()
        return result.data
    except Exception as e:
        logger.warning("get_user_by_email failed for lookup: %s", type(e).__name__)
        return None
