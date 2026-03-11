/**
 * =========================================================
 * RESUME SCORING - PIPELINE
 * =========================================================
 *
 * PURPOSE:
 *
 * This file orchestrates the full v1 resume scoring flow.
 *
 * PIPELINE:
 *
 * 1. Accept raw resume text + structured resume content
 * 2. Run all category scorers
 * 3. Aggregate category results
 * 4. Return normalized scoring output
 *
 * IMPORTANT:
 *
 * This is a deterministic-first scoring pipeline.
 *
 * The goal of v1 is:
 * - credibility
 * - explainability
 * - stable outputs
 * - useful feedback
 *
 * NOT:
 * - perfect human judgment
 * - mysterious AI-only scoring
 *
 * =========================================================
 */

import type {
  ResumeScoringInput,
  ResumeScoringOutput,
  CategoryScoreResult,
} from './scoring-types';

import {
  scoreATSCompatibility,
  scoreKeywordCoverage,
  scoreBulletStrength,
  scoreFormatting,
  scoreSectionCompleteness,
  scoreToneSeniorityFit,
} from './category-scorers';

import { aggregateCategoryScores } from './score-aggregator';


/**
 * ---------------------------------------------------------
 * RUN ALL CATEGORY SCORERS
 * ---------------------------------------------------------
 *
 * Executes each scoring category and returns the full list
 * of category-level results.
 */
function runCategoryScorers(
  input: ResumeScoringInput,
): CategoryScoreResult[] {
  return [
    scoreATSCompatibility(input),
    scoreKeywordCoverage(input),
    scoreBulletStrength(input),
    scoreFormatting(input),
    scoreSectionCompleteness(input),
    scoreToneSeniorityFit(input),
  ];
}


/**
 * ---------------------------------------------------------
 * SCORE RESUME
 * ---------------------------------------------------------
 *
 * Main scoring engine entrypoint for v1.
 *
 * Accepts:
 * - raw resume text
 * - canonical ResumeContentJson
 *
 * Returns:
 * - ScoreSnapshot
 * - issues
 * - recommendations
 * - triggered rules
 *
 * NOTE:
 * Job-description-aware scoring will be layered on later.
 */
export function scoreResume(
  input: ResumeScoringInput,
): ResumeScoringOutput {
  const categoryResults = runCategoryScorers(input);

  return aggregateCategoryScores(categoryResults);
}