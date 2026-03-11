/**
 * =========================================================
 * RESUME COMPARISON - REPORT BUILDER
 * =========================================================
 *
 * PURPOSE:
 *
 * Combines score comparison, section diff, and experience
 * diff into a final ResumeComparisonReport object.
 *
 * This is the structured output the UI will consume.
 *
 * =========================================================
 */

import type { ResumeComparisonInput, ResumeComparisonReport } from './comparison-types';

import { buildScoreComparison } from './score-comparison';
import { buildSectionDiff } from './section-diff';
import { buildExperienceDiff } from './bullet-diff';


export function buildComparisonReport(
  input: ResumeComparisonInput,
): ResumeComparisonReport {

  const score = buildScoreComparison(
    input.originalScore,
    input.optimizedScore,
  );

  const sections = buildSectionDiff(
    input.originalContent,
    input.optimizedContent,
  );

  const experience = buildExperienceDiff(
    input.originalContent,
    input.optimizedContent,
  );

  return {
    score,
    sections,
    experience,
  };
}