/**
 * =========================================================
 * RESUME INTELLIGENCE - ORCHESTRATOR TYPES
 * =========================================================
 *
 * PURPOSE:
 *
 * This file defines the shared types used by the Resume
 * Intelligence Orchestrator.
 *
 * The orchestrator is the application-level pipeline that
 * connects the core engines:
 *
 * - resume parser
 * - resume scoring
 * - resume optimizer
 * - resume comparison
 *
 * WHY THIS MATTERS:
 *
 * The frontend and API should not need to manually call
 * every engine in sequence.
 *
 * Instead, they should call one orchestrator flow that
 * returns a unified result.
 *
 * =========================================================
 */

import type {
  ResumeContentJson,
} from '../../core/schema';

import type {
  ResumeParserOutput,
} from '../resume-parser/parser-types';

import type {
  ResumeScoringOutput,
} from '../resume-scoring/scoring-types';

import type {
  ResumeOptimizerOutput,
} from '../resume-optimizer/optimizer-types';

import type {
  ResumeComparisonReport,
} from '../resume-comparison/comparison-types';

import type {
  JobIntelligenceResult,
} from '../job-intelligence/job-intelligence-types';


/**
 * ---------------------------------------------------------
 * ORCHESTRATOR INPUT
 * ---------------------------------------------------------
 *
 * Minimum input required to run the full v1 resume
 * intelligence pipeline.
 *
 * V1 keeps this simple:
 * - raw resume text only
 *
 * Later versions may add:
 * - userId
 * - job description
 * - selected template
 * - package type
 */
export interface ResumeIntelligenceInput {
  rawText: string;
}


/**
 * ---------------------------------------------------------
 * ORCHESTRATOR OUTPUT
 * ---------------------------------------------------------
 *
 * Final normalized result returned by the full
 * resume-intelligence pipeline.
 *
 * This provides all major artifacts needed by:
 * - API routes
 * - frontend flows
 * - future persistence layer
 */
export interface ResumeIntelligenceOutput {
  parser: ResumeParserOutput;

  originalScoring: ResumeScoringOutput;

  optimizer: ResumeOptimizerOutput;

  optimizedScoring: ResumeScoringOutput;

  comparison: ResumeComparisonReport;

  jobIntelligence?: JobIntelligenceResult;
}


/**
 * ---------------------------------------------------------
 * ORCHESTRATOR STEP NAME
 * ---------------------------------------------------------
 *
 * Optional step identifiers that can help later with:
 * - logging
 * - debugging
 * - analytics
 */
export type ResumeIntelligenceStepName =
  | 'parse'
  | 'score_original'
  | 'optimize'
  | 'score_optimized'
  | 'compare';


/**
 * ---------------------------------------------------------
 * OPTIONAL STEP RESULT
 * ---------------------------------------------------------
 *
 * Lightweight shape for future internal tracing if we want
 * step-level status visibility later.
 *
 * NOTE:
 * This is not used deeply in v1 yet, but defining it now
 * keeps the orchestrator extensible.
 */
export interface ResumeIntelligenceStepResult<T> {
  step: ResumeIntelligenceStepName;
  success: boolean;
  result: T;
}


/**
 * ---------------------------------------------------------
 * CONVENIENCE TYPE
 * ---------------------------------------------------------
 *
 * Helps clarify the main optimized content object that
 * downstream layers will often care about.
 */
export type OptimizedResumeContent = ResumeContentJson;