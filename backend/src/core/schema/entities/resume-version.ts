/**
 * =========================================================
 * RESUME VERSION ENTITY
 * =========================================================
 *
 * This is one of the most important entities in the entire
 * platform.
 *
 * Every meaningful transformation of a resume becomes a
 * ResumeVersion.
 *
 * Examples:
 * - original parsed resume
 * - ATS optimized resume
 * - job tailored resume
 * - role-specific resume
 * - template-based variation
 *
 * WHY THIS MATTERS:
 *
 * We never want to overwrite the original resume.
 *
 * Versioning makes it possible to support:
 * - before/after comparison
 * - resume history
 * - per-job tailoring
 * - template rendering
 * - future learning from outcomes
 *
 * =========================================================
 */

import {
  ResumeVersionType,
  TemplateType,
  ProcessingStatus,
} from '../enums';

import { UUID, ISODateTime } from '../primitives';
import { ResumeContentJson } from '../resume-content';
import { ScoreSnapshot, ChangeSummary } from '../score';
import { GenerationMetadata } from '../common';


/**
 * ---------------------------------------------------------
 * RESUME VERSION
 * ---------------------------------------------------------
 *
 * Canonical structured version of a resume.
 *
 * RULES:
 * - The first version should be `original`
 * - Derived versions should reference `sourceVersionId`
 * - Only one version should be active per Resume at a time
 */
export interface ResumeVersion {
  id: UUID;
  resumeId: UUID;
  versionType: ResumeVersionType;
  contentJson: ResumeContentJson;
  htmlPreview?: string | null;
  pdfUrl?: string | null;
  templateId?: TemplateType | null;
  scoreSnapshot?: ScoreSnapshot | null;
  changeSummary?: ChangeSummary | null;
  sourceVersionId?: UUID | null;
  isActive: boolean;
  toneProfile?: Record<string, unknown> | null;
  generationMetadata?: GenerationMetadata | null;
  processingStatus?: ProcessingStatus | null;
  processingError?: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}