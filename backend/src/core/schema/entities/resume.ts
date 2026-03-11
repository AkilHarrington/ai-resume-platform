/**
 * =========================================================
 * RESUME ENTITY
 * =========================================================
 *
 * This file defines the canonical Resume entity.
 *
 * IMPORTANT:
 * Resume is the parent record for an uploaded or pasted
 * resume. It stores source metadata and raw extracted text.
 *
 * It does NOT store the final structured/generated versions
 * of the resume. Those belong in ResumeVersion.
 *
 * This separation is critical for:
 *
 * - version history
 * - before/after comparison
 * - AI optimization
 * - template switching
 * - future performance tracking
 *
 * =========================================================
 */

import {
  ResumeSourceType,
  ParsingStatus,
  TemplateType,
} from '../enums';

import { UUID, ISODateTime } from '../primitives';


/**
 * ---------------------------------------------------------
 * RESUME
 * ---------------------------------------------------------
 *
 * Canonical parent resume record.
 */
export interface Resume {
  id: UUID;
  userId: UUID;
  sourceType: ResumeSourceType;
  originalFileName?: string | null;
  originalFileUrl?: string | null;
  rawText: string;
  detectedLanguage?: string | null;
  parsingStatus: ParsingStatus;
  latestVersionId?: UUID | null;
  activeTemplate?: TemplateType | null;
  notes?: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}