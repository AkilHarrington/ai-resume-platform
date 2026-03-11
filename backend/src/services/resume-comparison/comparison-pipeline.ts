/**
 * =========================================================
 * RESUME COMPARISON - PIPELINE
 * =========================================================
 *
 * PURPOSE:
 *
 * This file orchestrates the full v1 resume comparison flow.
 *
 * PIPELINE:
 *
 * 1. Accept original resume content + optimized resume content
 * 2. Accept original score + optimized score
 * 3. Build the structured comparison report
 * 4. Return the normalized comparison result
 *
 * IMPORTANT:
 *
 * This engine does not:
 * - rescore resumes
 * - re-optimize resumes
 * - mutate input content
 *
 * It only compares already-produced results.
 *
 * =========================================================
 */

import type {
  ResumeComparisonInput,
  ResumeComparisonReport,
} from './comparison-types';

import { buildComparisonReport } from './comparison-report';


/**
 * ---------------------------------------------------------
 * COMPARE RESUMES
 * ---------------------------------------------------------
 *
 * Main comparison engine entrypoint for v1.
 *
 * Returns a structured ResumeComparisonReport that can be
 * consumed by:
 * - UI before/after views
 * - marketing demos
 * - future analytics/reporting layers
 */
export function compareResumes(
  input: ResumeComparisonInput,
): ResumeComparisonReport {
  return buildComparisonReport(input);
}