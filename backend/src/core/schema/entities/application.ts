/**
 * =========================================================
 * APPLICATION ENTITY
 * =========================================================
 *
 * This file defines the canonical Application entity.
 *
 * Application represents a real-world job application
 * tracked by the user.
 *
 * WHY THIS MATTERS:
 *
 * This moves the platform beyond document creation and into
 * real application workflow management.
 *
 * This entity is also critical for future learning because
 * it can later connect:
 * - which resume version was used
 * - which role was applied for
 * - what outcome occurred
 *
 * =========================================================
 */

import {
  ApplicationStatus,
  ApplicationOutcome,
} from '../enums';

import { UUID, ISODateTime } from '../primitives';


/**
 * ---------------------------------------------------------
 * APPLICATION
 * ---------------------------------------------------------
 *
 * Canonical domain model for a tracked job application.
 *
 * NOTE:
 * - `status` = current stage in the application process
 * - `outcome` = meaningful/final result of the application
 */
export interface Application {
  id: UUID;
  userId: UUID;
  companyName: string;
  roleTitle: string;
  status: ApplicationStatus;
  jobDescriptionId?: UUID | null;
  resumeVersionId?: UUID | null;
  appliedAt?: ISODateTime | null;
  notes?: string | null;
  nextActionAt?: ISODateTime | null;
  interviewDate?: ISODateTime | null;
  outcome: ApplicationOutcome;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
