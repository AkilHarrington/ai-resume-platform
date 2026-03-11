/**
 * =========================================================
 * RESUME COMPARISON - SHARED TYPES
 * =========================================================
 *
 * PURPOSE:
 *
 * This file defines the internal types used by the resume
 * comparison engine.
 *
 * The comparison engine analyzes:
 * - original resume content
 * - optimized resume content
 * - original scoring snapshot
 * - optimized scoring snapshot
 *
 * and produces a structured ComparisonReport used by the UI
 * to explain improvements.
 *
 * IMPORTANT:
 *
 * These types are internal engine types, not database
 * entities. They are designed to support:
 *
 * - before/after visualization
 * - improvement scoring
 * - highlighted bullet changes
 * - optimization transparency
 *
 * =========================================================
 */

import type {
  ResumeContentJson,
  ScoreSnapshot,
} from '../../core/schema';


/**
 * ---------------------------------------------------------
 * COMPARISON INPUT
 * ---------------------------------------------------------
 *
 * Required input to generate a resume comparison report.
 */
export interface ResumeComparisonInput {
  originalContent: ResumeContentJson;
  optimizedContent: ResumeContentJson;

  originalScore: ScoreSnapshot;
  optimizedScore: ScoreSnapshot;
}


/**
 * ---------------------------------------------------------
 * SCORE COMPARISON
 * ---------------------------------------------------------
 *
 * Represents score improvement between original and
 * optimized resumes.
 */
export interface ScoreComparison {
  before: number;
  after: number;
  improvement: number;
}


/**
 * ---------------------------------------------------------
 * SECTION DIFF
 * ---------------------------------------------------------
 *
 * Indicates whether major sections changed.
 */
export interface SectionDiff {
  headlineChanged: boolean;
  summaryChanged: boolean;
  skillsChanged: boolean;
  experienceChanged: boolean;
}


/**
 * ---------------------------------------------------------
 * BULLET CHANGE
 * ---------------------------------------------------------
 *
 * Represents a rewritten experience bullet.
 */
export interface BulletChange {
  before: string;
  after: string;
}


/**
 * ---------------------------------------------------------
 * EXPERIENCE DIFF
 * ---------------------------------------------------------
 *
 * Captures bullet changes across experience entries.
 */
export interface ExperienceDiff {
  bulletsChanged: number;
  rewrittenBullets: BulletChange[];
}


/**
 * ---------------------------------------------------------
 * COMPARISON REPORT
 * ---------------------------------------------------------
 *
 * Final output returned by the comparison engine.
 *
 * This object powers:
 * - UI improvement displays
 * - score delta visualization
 * - bullet improvement highlights
 */
export interface ResumeComparisonReport {
  score: ScoreComparison;

  sections: SectionDiff;

  experience: ExperienceDiff;
}