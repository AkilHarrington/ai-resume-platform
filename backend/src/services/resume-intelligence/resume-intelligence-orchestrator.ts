/**
 * =========================================================
 * RESUME INTELLIGENCE - ORCHESTRATOR
 * =========================================================
 *
 * PURPOSE:
 *
 * This file orchestrates the full v1 resume-intelligence
 * flow by connecting the platform's core engines:
 *
 * - resume parser
 * - resume scoring
 * - resume optimizer
 * - resume comparison
 *
 * PIPELINE:
 *
 * 1. Parse raw resume text
 * 2. Score the original structured resume
 * 3. Optimize the structured resume
 * 4. Score the optimized resume
 * 5. Compare original vs optimized results
 * 6. Return one unified application-level result
 *
 * WHY THIS MATTERS:
 *
 * This becomes the single high-level backend flow that API
 * routes and frontend product experiences can rely on.
 *
 * =========================================================
 */

import type {
  ResumeIntelligenceInput,
  ResumeIntelligenceOutput,
} from './orchestrator-types';

import { parseResumeText } from '../resume-parser/parser-pipeline';
import { scoreResume } from '../resume-scoring/scoring-pipeline';
import { optimizeResume } from '../resume-optimizer/optimizer-pipeline';
import { compareResumes } from '../resume-comparison/comparison-pipeline';


/**
 * ---------------------------------------------------------
 * RUN RESUME INTELLIGENCE PIPELINE
 * ---------------------------------------------------------
 *
 * Main application-level entrypoint for the v1
 * resume-intelligence system.
 *
 * Accepts:
 * - raw resume text
 *
 * Returns:
 * - parser output
 * - original scoring output
 * - optimizer output
 * - optimized scoring output
 * - comparison report
 *
 * NOTE:
 * This function is intentionally synchronous in structure
 * because the current core engines are synchronous.
 *
 * If later versions introduce async/AI/network behavior,
 * this orchestration layer can evolve without changing the
 * overall pipeline contract.
 */
export function runResumeIntelligence(
  input: ResumeIntelligenceInput,
): ResumeIntelligenceOutput {
  /**
   * Step 1: Parse raw text into canonical structured resume.
   */
  const parser = parseResumeText({
    rawText: input.rawText,
  });

  /**
   * Step 2: Score the original parsed resume.
   */
  const originalScoring = scoreResume({
    rawText: input.rawText,
    contentJson: parser.output.contentJson,
  });

  /**
   * Step 3: Optimize the structured resume using scoring
   * feedback and structured recommendations.
   */
  const optimizer = optimizeResume({
    rawText: input.rawText,
    contentJson: parser.output.contentJson,
    scoreSnapshot: originalScoring.scoreSnapshot,
    issues: originalScoring.issues,
    recommendations: originalScoring.recommendations,
  });

  /**
   * Step 4: Score the optimized resume.
   *
   * NOTE:
   * For v1 we still use the same rawText because formatting-
   * level rescoring from rendered output is not yet part of
   * the system. The structured content is what changes here.
   */
  const optimizedScoring = scoreResume({
    rawText: input.rawText,
    contentJson: optimizer.optimizedContentJson,
  });

  /**
   * Step 5: Compare original vs optimized outputs.
   */
  const comparison = compareResumes({
    originalContent: parser.output.contentJson,
    optimizedContent: optimizer.optimizedContentJson,
    originalScore: originalScoring.scoreSnapshot,
    optimizedScore: optimizedScoring.scoreSnapshot,
  });

  /**
   * Step 6: Return the unified orchestration result.
   */
  return {
    parser: parser.output,
    originalScoring,
    optimizer,
    optimizedScoring,
    comparison,
  };
}