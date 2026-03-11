/**
 * =========================================================
 * CAREER SUGGESTION ENTITY
 * =========================================================
 *
 * This file defines the canonical CareerSuggestion entity.
 *
 * CareerSuggestion represents broader career guidance
 * generated from a user's resume data.
 *
 * WHY THIS MATTERS:
 *
 * The platform is not just a resume tool.
 * It is being designed as a Career Intelligence Platform.
 *
 * This entity gives the system a place to store:
 * - recommended adjacent roles
 * - transferable skills
 * - skill gaps
 * - high-level career direction
 *
 * =========================================================
 */

import { UUID, ISODateTime, Score100 } from '../primitives';


/**
 * ---------------------------------------------------------
 * CAREER SUGGESTION
 * ---------------------------------------------------------
 *
 * Canonical domain model for role and career guidance.
 */
export interface CareerSuggestion {
  id: UUID;
  resumeId: UUID;
  recommendedRoles?: string[] | null;
  transferableSkills?: string[] | null;
  skillGaps?: string[] | null;
  confidenceScore?: Score100 | null;
  reasoningSummary?: string | null;
  createdAt: ISODateTime;
}