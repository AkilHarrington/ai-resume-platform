/**
 * =========================================================
 * RESUME COMPARISON - SCORE COMPARISON
 * =========================================================
 *
 * PURPOSE:
 *
 * Calculates the score improvement between the original
 * resume and the optimized resume.
 *
 * This powers the core product signal:
 *
 *    "Your resume improved from 58 → 82"
 *
 * IMPORTANT:
 *
 * The scoring engine already produces ScoreSnapshot objects.
 * This module only compares them and computes the delta.
 *
 * =========================================================
 */

import type { ScoreSnapshot } from '../../core/schema';

import type { ScoreComparison } from './comparison-types';


/**
 * ---------------------------------------------------------
 * CLAMP IMPROVEMENT
 * ---------------------------------------------------------
 *
 * Ensures the improvement value remains within reasonable
 * bounds. This protects against accidental scoring errors.
 */
function clampImprovement(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  if (value < -100) {
    return -100;
  }

  return value;
}


/**
 * ---------------------------------------------------------
 * BUILD SCORE COMPARISON
 * ---------------------------------------------------------
 *
 * Calculates before/after score comparison.
 */
export function buildScoreComparison(
  originalScore: ScoreSnapshot,
  optimizedScore: ScoreSnapshot,
): ScoreComparison {
  const before = originalScore.overall ?? 0;
  const after = optimizedScore.overall ?? 0;

  const improvement = clampImprovement(after - before);

  return {
    before,
    after,
    improvement,
  };
}