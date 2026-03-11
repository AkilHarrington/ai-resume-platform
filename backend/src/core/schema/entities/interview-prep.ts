/**
 * =========================================================
 * INTERVIEW PREP ENTITY
 * =========================================================
 *
 * This file defines the canonical InterviewPrep entity.
 *
 * InterviewPrep represents generated interview preparation
 * tied to a specific resume version and optionally a target
 * job description.
 *
 * WHY THIS MATTERS:
 *
 * Interview prep should align with the exact version of the
 * resume used for a role.
 *
 * This allows the platform to generate:
 * - likely interview questions
 * - story prompts
 * - focus areas
 * - preparation summaries
 *
 * =========================================================
 */

import { UUID, ISODateTime } from '../primitives';


/**
 * ---------------------------------------------------------
 * INTERVIEW PREP
 * ---------------------------------------------------------
 *
 * Canonical domain model for interview preparation output.
 */
export interface InterviewPrep {
  id: UUID;
  resumeVersionId: UUID;
  jobDescriptionId?: UUID | null;
  questions?: string[] | null;
  storyPrompts?: string[] | null;
  focusAreas?: string[] | null;
  prepSummary?: string | null;
  createdAt: ISODateTime;
}