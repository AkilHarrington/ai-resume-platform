/**
 * =========================================================
 * SCHEMA VALIDATION RULES
 * =========================================================
 *
 * This file contains schema-level validation helpers and
 * rule definitions.
 *
 * IMPORTANT:
 *
 * These are not full parser, API, or database validations.
 * They are lightweight schema rules that help keep the
 * domain model consistent.
 *
 * =========================================================
 */

import {
  ResumeScanType,
  ResumeSourceType,
  ResumeVersionType,
} from './enums';


/**
 * ---------------------------------------------------------
 * SCORE VALIDATION
 * ---------------------------------------------------------
 *
 * Ensures a score is an integer between 0 and 100.
 */
export function isValidScore(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}


/**
 * ---------------------------------------------------------
 * RESUME SOURCE VALIDATION
 * ---------------------------------------------------------
 *
 * If a resume was pasted directly into the platform,
 * file URL may be null.
 *
 * For file-based sources, a file URL should normally exist.
 */
export function canResumeSourceOmitFileUrl(
  sourceType: ResumeSourceType,
): boolean {
  return sourceType === 'pasted_text';
}


/**
 * ---------------------------------------------------------
 * RESUME VERSION RULES
 * ---------------------------------------------------------
 *
 * The first version created for a resume should be the
 * original version.
 */
export function isOriginalResumeVersion(
  versionType: ResumeVersionType,
): boolean {
  return versionType === 'original';
}


/**
 * ---------------------------------------------------------
 * JOB MATCH SCAN RULE
 * ---------------------------------------------------------
 *
 * A job match scan must reference a specific job description.
 */
export function requiresJobDescriptionId(
  scanType: ResumeScanType,
): boolean {
  return scanType === 'job_match_scan';
}


/**
 * ---------------------------------------------------------
 * ACTIVE VERSION POLICY
 * ---------------------------------------------------------
 *
 * This is a documented policy rule rather than an enforced
 * function at this layer.
 *
 * RULE:
 * Only one ResumeVersion should be active per Resume
 * at a time.
 */
export const ACTIVE_RESUME_VERSION_POLICY =
  'Only one active ResumeVersion is allowed per Resume.';


/**
 * ---------------------------------------------------------
 * DERIVED VERSION POLICY
 * ---------------------------------------------------------
 *
 * Derived resume versions should reference the version they
 * were created from.
 */
export const DERIVED_VERSION_POLICY =
  'Derived ResumeVersions should set sourceVersionId whenever applicable.';


/**
 * ---------------------------------------------------------
 * TEMPLATE VARIANT POLICY
 * ---------------------------------------------------------
 *
 * Template variants should only change rendering/presentation,
 * not factual resume content.
 */
export const TEMPLATE_VARIANT_POLICY =
  'Template variants must not alter factual resume content.';