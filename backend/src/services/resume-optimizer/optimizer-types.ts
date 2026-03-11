/**
 * =========================================================
 * RESUME OPTIMIZER - SHARED TYPES
 * =========================================================
 *
 * PURPOSE:
 *
 * This file defines the internal types used by the resume
 * optimization engine.
 *
 * The optimizer takes:
 * - raw resume text
 * - canonical structured resume content
 * - scoring feedback
 * - issues
 * - recommendations
 *
 * and produces:
 * - improved ResumeContentJson
 * - structured change metadata
 * - optimization warnings
 *
 * IMPORTANT:
 *
 * These are optimizer-engine types, not database entities.
 * The final output must still conform to the canonical
 * schema defined in:
 *
 *   core/schema/resume-content.ts
 *   core/schema/score.ts
 *
 * =========================================================
 */

import type {
  ResumeContentJson,
  ScoreSnapshot,
  IssueItem,
  RecommendationItem,
  ChangeSummary,
} from '../../core/schema';


/**
 * ---------------------------------------------------------
 * OPTIMIZABLE SECTION NAMES
 * ---------------------------------------------------------
 *
 * These are the main resume sections v1 of the optimizer
 * is allowed to improve.
 */
export type OptimizableSectionName =
  | 'headline'
  | 'summary'
  | 'skills'
  | 'experience';


/**
 * ---------------------------------------------------------
 * OPTIMIZER INPUT
 * ---------------------------------------------------------
 *
 * Minimum input required to run a general resume
 * optimization pass.
 *
 * NOTE:
 * Job-description-aware optimization will be added later.
 */
export interface ResumeOptimizerInput {
  rawText: string;
  contentJson: ResumeContentJson;
  scoreSnapshot: ScoreSnapshot;
  issues: IssueItem[];
  recommendations: RecommendationItem[];
}


/**
 * ---------------------------------------------------------
 * OPTIMIZATION WARNING
 * ---------------------------------------------------------
 *
 * Warnings allow the optimizer to communicate situations
 * where it chose to preserve content rather than force a
 * risky rewrite.
 *
 * Examples:
 * - summary too sparse to confidently improve
 * - experience bullets too ambiguous
 * - skills section missing entirely
 */
export interface ResumeOptimizationWarning {
  code: string;
  message: string;
  section?: OptimizableSectionName;
}


/**
 * ---------------------------------------------------------
 * SECTION OPTIMIZATION RESULT
 * ---------------------------------------------------------
 *
 * Represents the result of optimizing a single section.
 *
 * This helps keep the optimizer modular and traceable.
 */
export interface SectionOptimizationResult<T> {
  changed: boolean;
  value: T;
  warnings: ResumeOptimizationWarning[];
}


/**
 * ---------------------------------------------------------
 * OPTIMIZER OUTPUT
 * ---------------------------------------------------------
 *
 * Final normalized output produced by the optimizer.
 *
 * This output can later be turned into a new ResumeVersion.
 */
export interface ResumeOptimizerOutput {
  optimizedContentJson: ResumeContentJson;
  changeSummary: ChangeSummary;
  warnings: ResumeOptimizationWarning[];
}