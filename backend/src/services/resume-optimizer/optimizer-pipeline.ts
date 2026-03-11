/**
 * =========================================================
 * RESUME OPTIMIZER - PIPELINE
 * =========================================================
 *
 * PURPOSE:
 *
 * This file orchestrates the full v1 resume optimization
 * flow.
 *
 * PIPELINE:
 *
 * 1. Accept raw resume text + structured resume content
 *    + scoring feedback
 * 2. Optimize headline
 * 3. Optimize summary
 * 4. Optimize skills
 * 5. Optimize experience
 * 6. Build a structured change summary
 * 7. Aggregate optimization warnings
 * 8. Return normalized optimizer output
 *
 * IMPORTANT:
 *
 * This is a conservative optimization pipeline.
 *
 * The goal of v1 is:
 * - improve weak sections
 * - preserve grounded facts
 * - keep output schema-safe
 * - avoid hallucinated experience
 *
 * NOT:
 * - rewrite the whole resume aggressively
 * - invent metrics
 * - fabricate leadership claims
 * - perform job-specific tailoring
 *
 * =========================================================
 */

import type {
  ResumeOptimizerInput,
  ResumeOptimizerOutput,
  ResumeOptimizationWarning,
} from './optimizer-types';

import { optimizeHeadline } from './headline-optimizer';
import { optimizeSummary } from './summary-optimizer';
import { optimizeSkills } from './skills-optimizer';
import { optimizeExperience } from './experience-optimizer';
import { buildChangeSummary } from './change-summary';


/**
 * ---------------------------------------------------------
 * MERGE WARNINGS
 * ---------------------------------------------------------
 *
 * Collects all warnings from the individual optimization
 * modules into one flat list.
 */
function mergeWarnings(
  warnings: ResumeOptimizationWarning[][],
): ResumeOptimizationWarning[] {
  return warnings.flat();
}


/**
 * ---------------------------------------------------------
 * OPTIMIZE RESUME
 * ---------------------------------------------------------
 *
 * Main optimizer entrypoint for v1.
 *
 * Accepts:
 * - raw resume text
 * - canonical ResumeContentJson
 * - score snapshot
 * - issues
 * - recommendations
 *
 * Returns:
 * - optimized ResumeContentJson
 * - ChangeSummary
 * - optimization warnings
 *
 * NOTE:
 * In v1, the section optimizers rely mostly on the
 * structured resume content itself. Scoring feedback is
 * already part of the contract because later versions will
 * use it more deeply for targeting decisions.
 */
export function optimizeResume(
  input: ResumeOptimizerInput,
): ResumeOptimizerOutput {
  const original = input.contentJson;

  const headlineResult = optimizeHeadline(original);

  const headlineOptimizedContent = {
    ...original,
    headline: headlineResult.value,
  };

  const summaryResult = optimizeSummary(headlineOptimizedContent);

  const summaryOptimizedContent = {
    ...headlineOptimizedContent,
    summary: summaryResult.value,
  };

  const skillsResult = optimizeSkills(summaryOptimizedContent);

  const skillsOptimizedContent = {
    ...summaryOptimizedContent,
    skills: skillsResult.value,
  };

  const experienceResult = optimizeExperience(skillsOptimizedContent);

  const optimizedContentJson = {
    ...skillsOptimizedContent,
    experience: experienceResult.value,
  };

  const changeSummary = buildChangeSummary(
    original,
    optimizedContentJson,
  );

  const warnings = mergeWarnings([
    headlineResult.warnings,
    summaryResult.warnings,
    skillsResult.warnings,
    experienceResult.warnings,
  ]);

  return {
    optimizedContentJson,
    changeSummary,
    warnings,
  };
}