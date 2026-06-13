# =========================================================
# File: services/supabase_service.py
# Purpose:
# Supabase client + helpers for user pro status.
# =========================================================

import os
from supabase import create_client, Client


def get_client() -> Client:
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.")
    return create_client(url, key)


def verify_token(token: str) -> dict | None:
    """Verify a Supabase JWT and return {id, email}, or None if invalid."""
    try:
        client = get_client()
        response = client.auth.get_user(token)
        user = response.user
        if not user:
            return None
        return {"id": user.id, "email": user.email}
    except Exception:
        return None


def get_user_pro_status(user_id: str) -> bool:
    """Return True if the user has an active Pro subscription."""
    try:
        client = get_client()
        result = client.table("profiles").select("is_pro").eq("id", user_id).single().execute()
        return bool(result.data.get("is_pro", False))
    except Exception:
        return False


def set_user_pro(user_id: str, stripe_customer_id: str = "", stripe_subscription_id: str = "") -> None:
    """Flip is_pro=true for a user after successful Stripe payment."""
    try:
        client = get_client()
        client.table("profiles").upsert({
            "id": user_id,
            "is_pro": True,
            "stripe_customer_id": stripe_customer_id,
            "stripe_subscription_id": stripe_subscription_id,
        }).execute()
    except Exception as e:
        raise RuntimeError(f"Failed to update pro status: {e}")


def revoke_user_pro(stripe_customer_id: str) -> None:
    """Flip is_pro=false when a Stripe subscription is cancelled."""
    try:
        client = get_client()
        client.table("profiles").update({"is_pro": False}).eq(
            "stripe_customer_id", stripe_customer_id
        ).execute()
    except Exception as e:
        raise RuntimeError(f"Failed to revoke pro status: {e}")


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
        client = get_client()
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
    except Exception:
        pass  # Never block the user over logging


def get_user_by_email(email: str) -> dict | None:
    """Look up a profile by email (used for webhook matching)."""
    try:
        client = get_client()
        result = client.table("profiles").select("id, email, is_pro").eq("email", email).single().execute()
        return result.data
    except Exception:
        return None
