# =========================================================
# File: services/exceptions.py
# Purpose:
# Custom exceptions for AI Resume Studio backend.
# =========================================================


class AIUnavailableError(Exception):
    """Raised when the Anthropic API is unreachable, overloaded, or returns an error.
    main.py catches this and returns a clean 503 to the frontend."""
    pass
