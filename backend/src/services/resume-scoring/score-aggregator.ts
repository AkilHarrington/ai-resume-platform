/**
 * =========================================================
 * RESUME SCORING - SCORE AGGREGATOR
 * =========================================================
 *
 * PURPOSE:
 *
 * This file combines category-level scoring results into
 * the final normalized scoring output used by the platform.
 *
 * RESPONSIBILITIES:
 *
 * - apply category weights
 * - calculate overall score
 * - build ScoreSnapshot
 * - merge issues
 * - merge recommendations
 * - merge triggered rules
 *
 * IMPORTANT:
 *
 * This layer should stay deterministic and tunable.
 *
 * If we ever want to improve scoring behavior later,
 * we should primarily adjust:
 * - category weights
 * - thresholds
 * - penalties
 * - category-level logic
 *
 * We should NOT need to redesign the overall architecture.
 *
 * =========================================================
 */

import type {
  CategoryScoreResult,
  ResumeScoringOutput,
  ScoringCategoryName,
} from './scoring-types';

import type { RulesTriggeredMap } from '../../core/schema';


/**
 * ---------------------------------------------------------
 * CATEGORY WEIGHTS
 * ---------------------------------------------------------
 *
 * These weights define how much each category contributes
 * to the final overall score.
 *
 * V1 WEIGHTING STRATEGY:
 * - Bullet strength matters most
 * - ATS compatibility matters heavily
 * - Section completeness and tone matter meaningfully
 * - Formatting matters, but should not dominate
 */
const CATEGORY_WEIGHTS: Record<ScoringCategoryName, number> = {
  atsCompatibility: 0.20,
  keywordMatch: 0.15,
  bulletStrength: 0.25,
  formatting: 0.10,
  sectionCompleteness: 0.15,
  toneSeniorityFit: 0.15,
};


/**
 * ---------------------------------------------------------
 * CLAMP SCORE
 * ---------------------------------------------------------
 *
 * Keeps all final scores inside the valid 0–100 range.
 */
function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}


/**
 * ---------------------------------------------------------
 * MERGE RULE MAPS
 * ---------------------------------------------------------
 *
 * Combines all triggered rule objects into one final
 * RulesTriggeredMap.
 */
function mergeRuleMaps(
  results: CategoryScoreResult[],
): RulesTriggeredMap {
  const merged: RulesTriggeredMap = {};

  for (const result of results) {
    Object.assign(merged, result.rulesTriggered);
  }

  return merged;
}


/**
 * ---------------------------------------------------------
 * MERGE ISSUES
 * ---------------------------------------------------------
 *
 * Concatenates issues from all categories.
 *
 * NOTE:
 * We intentionally keep this simple for v1.
 * Later we may de-duplicate by issue code if needed.
 */
function mergeIssues(
  results: CategoryScoreResult[],
): ResumeScoringOutput['issues'] {
  return results.flatMap((result) => result.issues);
}


/**
 * ---------------------------------------------------------
 * MERGE RECOMMENDATIONS
 * ---------------------------------------------------------
 *
 * Concatenates recommendations from all categories.
 *
 * NOTE:
 * We intentionally keep this simple for v1.
 * Later we may add smarter ranking / de-duplication.
 */
function mergeRecommendations(
  results: CategoryScoreResult[],
): ResumeScoringOutput['recommendations'] {
  return results.flatMap((result) => result.recommendations);
}


/**
 * ---------------------------------------------------------
 * CALCULATE OVERALL SCORE
 * ---------------------------------------------------------
 *
 * Computes the weighted overall score from the category
 * results.
 */
function calculateOverallScore(
  results: CategoryScoreResult[],
): number {
  const weightedSum = results.reduce((sum, result) => {
    const weight = CATEGORY_WEIGHTS[result.category] ?? 0;
    return sum + result.score * weight;
  }, 0);

  return clampScore(weightedSum);
}


/**
 * ---------------------------------------------------------
 * BUILD SCORE SNAPSHOT
 * ---------------------------------------------------------
 *
 * Converts category results into the canonical ScoreSnapshot
 * used by the schema layer.
 */
function buildScoreSnapshot(
  results: CategoryScoreResult[],
) {
  const scoreMap: Partial<Record<ScoringCategoryName, number>> = {};

  for (const result of results) {
    scoreMap[result.category] = result.score;
  }

  return {
    overall: calculateOverallScore(results),
    atsCompatibility: scoreMap.atsCompatibility ?? 0,
    keywordMatch: scoreMap.keywordMatch ?? 0,
    bulletStrength: scoreMap.bulletStrength ?? 0,
    formatting: scoreMap.formatting ?? 0,
    sectionCompleteness: scoreMap.sectionCompleteness ?? 0,
    roleAlignment: 0,
    toneSeniorityFit: scoreMap.toneSeniorityFit ?? 0,
  };
}


/**
 * ---------------------------------------------------------
 * AGGREGATE CATEGORY SCORES
 * ---------------------------------------------------------
 *
 * Main aggregator entrypoint.
 *
 * Accepts all category-level scoring results and returns the
 * final normalized scoring output.
 *
 * NOTE:
 * `roleAlignment` is intentionally set to 0 for general
 * resume scoring in v1 because JD-aware alignment belongs to
 * a later job-specific scoring layer.
 */
export function aggregateCategoryScores(
  results: CategoryScoreResult[],
): ResumeScoringOutput {
  const scoreSnapshot = buildScoreSnapshot(results);
  const issues = mergeIssues(results);
  const recommendations = mergeRecommendations(results);
  const rulesTriggered = mergeRuleMaps(results);

  return {
    scoreSnapshot,
    issues,
    recommendations,
    rulesTriggered,
  };
}