/**
 * =========================================================
 * JOB DESCRIPTION ENTITY
 * =========================================================
 *
 * This file defines the canonical JobDescription entity.
 *
 * A job description is a first-class object in the system.
 * It is not just a temporary text blob.
 *
 * WHY THIS MATTERS:
 *
 * The platform needs job descriptions to support:
 * - resume match scoring
 * - missing keyword detection
 * - tailored resume generation
 * - interview preparation
 * - future career intelligence
 *
 * Raw job text and parsed job structure must remain
 * separate so the system stays traceable and reliable.
 *
 * =========================================================
 */

import {
  JobDescriptionSourceType,
  SeniorityLevel,
  EmploymentType,
  JobDescriptionStatus,
} from '../enums';

import { UUID, ISODateTime } from '../primitives';
import { JobDescriptionParsedJson } from '../job-description-content';


/**
 * ---------------------------------------------------------
 * JOB DESCRIPTION
 * ---------------------------------------------------------
 *
 * Canonical domain model for a target job description.
 */
export interface JobDescription {
  id: UUID;
  userId: UUID;
  sourceType: JobDescriptionSourceType;
  rawText: string;
  jobTitle?: string | null;
  companyName?: string | null;
  parsedJson?: JobDescriptionParsedJson | null;
  industry?: string | null;
  seniorityLevel?: SeniorityLevel | null;
  location?: string | null;
  employmentType?: EmploymentType | null;
  status: JobDescriptionStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}