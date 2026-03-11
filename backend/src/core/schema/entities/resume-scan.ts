/**
 * =========================================================
 * RESUME SCAN ENTITY
 * =========================================================
 *
 * This file defines the canonical ResumeScan entity.
 *
 * A ResumeScan represents a specific analysis event run
 * against a particular resume version.
 *
 * IMPORTANT:
 *
 * A scan is an event, not a permanent property of the
 * resume itself.
 *
 * WHY THIS MATTERS:
 *
 * The same resume version may be scanned:
 * - before optimization
 * - after optimization
 * - against a specific job description
 * - under updated scoring logic in the future
 *
 * Storing scans as events makes the platform:
 * - more flexible
 * - easier to debug
 * - better for analytics
 *
 * =========================================================
 */

import { ResumeScanType } from '../enums';
import { UUID, ISODateTime, Score100 } from '../primitives';
import {
  IssueItem,
  RecommendationItem,
  RulesTriggeredMap,
} from '../common';


/**
 * ---------------------------------------------------------
 * RESUME SCAN
 * ---------------------------------------------------------
 *
 * Canonical domain model for a resume analysis event.
 */
export interface ResumeScan {
  id: UUID;
  resumeId: UUID;
  resumeVersionId: UUID;
  scanType: ResumeScanType;
  overallScore: Score100;
  jobDescriptionId?: UUID | null;
  atsScore?: Score100 | null;
  keywordScore?: Score100 | null;
  bulletScore?: Score100 | null;
  formatScore?: Score100 | null;
  sectionCompletenessScore?: Score100 | null;
  toneFitScore?: Score100 | null;
  issues?: IssueItem[] | null;
  recommendations?: RecommendationItem[] | null;
  rulesTriggered?: RulesTriggeredMap | null;
  aiInsights?: Record<string, unknown> | null;
  createdAt: ISODateTime;
}