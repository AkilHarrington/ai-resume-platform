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


def get_user_by_email(email: str) -> dict | None:
    """Look up a profile by email (used for webhook matching)."""
    try:
        client = get_client()
        result = client.table("profiles").select("id, email, is_pro").eq("email", email).single().execute()
        return result.data
    except Exception:
        return None
