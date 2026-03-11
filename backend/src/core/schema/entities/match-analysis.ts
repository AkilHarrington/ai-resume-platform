/**
 * =========================================================
 * MATCH ANALYSIS ENTITY
 * =========================================================
 *
 * This file defines the canonical MatchAnalysis entity.
 *
 * MatchAnalysis represents the comparison between:
 * - a specific resume version
 * - a specific job description
 *
 * IMPORTANT:
 *
 * This entity stays separate from ResumeScan because
 * job matching is its own domain and will grow over time.
 *
 * WHY THIS MATTERS:
 *
 * Keeping this separate allows us to support:
 * - explainable job match scores
 * - matched keyword analysis
 * - missing keyword analysis
 * - weighted criteria logic
 * - future hiring probability models
 *
 * =========================================================
 */

import { UUID, ISODateTime, Score100 } from '../primitives';
import { RecommendationItem } from '../common';


/**
 * ---------------------------------------------------------
 * MATCH ANALYSIS
 * ---------------------------------------------------------
 *
 * Canonical domain model for resume-to-job comparison.
 */
export interface MatchAnalysis {
  id: UUID;
  resumeVersionId: UUID;
  jobDescriptionId: UUID;
  matchScore: Score100;
  matchedKeywords?: string[] | null;
  missingKeywords?: string[] | null;
  matchedSkills?: string[] | null;
  missingSkills?: string[] | null;
  strengths?: Record<string, unknown> | null;
  gaps?: Record<string, unknown> | null;
  recommendations?: RecommendationItem[] | null;
  weightedCriteria?: Record<string, unknown> | null;
  createdAt: ISODateTime;
}