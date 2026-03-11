/**
 * =========================================================
 * FRONTEND API - RESUME
 * =========================================================
 *
 * PURPOSE:
 *
 * Centralized frontend API functions for calling the backend
 * resume endpoints.
 *
 * WHY THIS MATTERS:
 *
 * We do not want raw fetch calls scattered across UI files.
 * This keeps frontend API logic:
 * - reusable
 * - cleaner
 * - easier to debug
 *
 * =========================================================
 */

const API_BASE_URL = "http://localhost:3000/api/resume";

/**
 * ---------------------------------------------------------
 * SCAN RESUME
 * ---------------------------------------------------------
 *
 * Calls:
 * POST /api/resume/scan
 */
export async function scanResume(rawText) {
  const response = await fetch(`${API_BASE_URL}/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rawText }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to scan resume.");
  }

  return data;
}

/**
 * ---------------------------------------------------------
 * OPTIMIZE RESUME
 * ---------------------------------------------------------
 *
 * Calls:
 * POST /api/resume/optimize
 */
export async function optimizeResume(rawText) {
  const response = await fetch(`${API_BASE_URL}/optimize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rawText }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to optimize resume.");
  }

  return data;
}