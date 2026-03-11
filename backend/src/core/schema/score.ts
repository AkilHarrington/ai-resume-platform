/**
 * =========================================================
 * SCORING SYSTEM STRUCTURE
 * =========================================================
 *
 * This file defines the scoring model used for resume
 * analysis.
 *
 * Every resume scan produces a score breakdown that
 * explains exactly how the overall score was calculated.
 *
 * This transparency is critical for:
 *
 * - user trust
 * - debugging
 * - analytics
 *
 * =========================================================
 */

import { Score100 } from './primitives';


/**
 * ---------------------------------------------------------
 * SCORE BREAKDOWN
 * ---------------------------------------------------------
 *
 * Each resume analysis generates this object.
 */
export interface ScoreSnapshot {

  overall: Score100;

  atsCompatibility: Score100;

  keywordMatch: Score100;

  bulletStrength: Score100;

  formatting: Score100;

  sectionCompleteness: Score100;

  roleAlignment: Score100;

  toneSeniorityFit: Score100;

}


/**
 * ---------------------------------------------------------
 * CHANGE SUMMARY
 * ---------------------------------------------------------
 *
 * Used when comparing resume versions.
 */
export interface ChangeSummary {

  summaryChanged: boolean;

  skillsAdded: string[];

  bulletsRewritten: number;

  sectionsModified: string[];

  reasonCodes: string[];

}