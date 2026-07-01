# =========================================================
# File: services/exceptions.py
# Purpose:
# Custom exceptions for AI Resume Studio backend.
# =========================================================


class AIUnavailableError(Exception):
    """Raised when the Anthropic API is unreachable, overloaded, or returns an error.
    main.py catches this and returns a clean 503 to the frontend."""
    pass


class AIRateLimitError(AIUnavailableError):
    """Raised specifically when Anthropic returns a 429 rate limit response.
    Callers can catch this to apply backoff or queue the request."""
    pass


class AIAuthError(AIUnavailableError):
    """Raised when the Anthropic API key is invalid or revoked.
    Distinct from rate limits — no point retrying an auth failure."""
    pass


class AIConnectionError(AIUnavailableError):
    """Raised when the connection to Anthropic's API cannot be established
    (DNS failure, network timeout at connect phase, etc.)."""
    pass


class AITimeoutError(AIUnavailableError):
    """Raised when a request to Anthropic times out after the connection
    was established — e.g. the model took too long to respond."""
    pass
