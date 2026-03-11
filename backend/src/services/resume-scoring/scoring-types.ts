/**
 * =========================================================
 * RESUME SCORING - SHARED TYPES
 * =========================================================
 *
 * PURPOSE:
 *
 * This file defines the internal types used by the resume
 * scoring engine.
 *
 * The scoring engine evaluates both:
 * - canonical structured resume content
 * - raw resume text
 *
 * WHY BOTH INPUTS MATTER:
 *
 * ResumeContentJson provides structure.
 * Raw text provides formatting and wording clues.
 *
 * IMPORTANT:
 *
 * These are scoring-engine types, not database entities.
 * Final outputs from this engine will later map into the
 * platform schema objects such as:
 *
 * - ScoreSnapshot
 * - ResumeScan
 * - IssueItem
 * - RecommendationItem
 *
 * =========================================================
 */

import type {
  ResumeContentJson,
  ScoreSnapshot,
  IssueItem,
  RecommendationItem,
  RulesTriggeredMap,
} from '../../core/schema';


/**
 * ---------------------------------------------------------
 * SCORING CATEGORY NAMES
 * ---------------------------------------------------------
 *
 * These are the main score buckets used by the engine.
 */
export type ScoringCategoryName =
  | 'atsCompatibility'
  | 'keywordMatch'
  | 'bulletStrength'
  | 'formatting'
  | 'sectionCompleteness'
  | 'toneSeniorityFit';


/**
 * ---------------------------------------------------------
 * SCORING INPUT
 * ---------------------------------------------------------
 *
 * Minimum input required for a general resume scoring run.
 *
 * NOTE:
 * Job-description-aware scoring can be added later without
 * changing the core scoring model.
 */
export interface ResumeScoringInput {
  rawText: string;
  contentJson: ResumeContentJson;
}


/**
 * ---------------------------------------------------------
 * CATEGORY SCORE RESULT
 * ---------------------------------------------------------
 *
 * Represents the result of scoring one category.
 */
export interface CategoryScoreResult {
  category: ScoringCategoryName;
  score: number;
  issues: IssueItem[];
  recommendations: RecommendationItem[];
  rulesTriggered: RulesTriggeredMap;
}


/**
 * ---------------------------------------------------------
 * SCORING PIPELINE OUTPUT
 * ---------------------------------------------------------
 *
 * Final normalized output produced by the scoring engine.
 */
export interface ResumeScoringOutput {
  scoreSnapshot: ScoreSnapshot;
  issues: IssueItem[];
  recommendations: RecommendationItem[];
  rulesTriggered: RulesTriggeredMap;
}


/**
 * ---------------------------------------------------------
 * RULE HELPER RESULT
 * ---------------------------------------------------------
 *
 * Internal shape for helper-style detections.
 */
export interface BooleanRuleResult {
  passed: boolean;
  ruleCode: string;
}