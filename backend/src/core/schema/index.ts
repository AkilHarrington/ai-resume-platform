/**
 * =========================================================
 * SCHEMA PACKAGE ENTRYPOINT
 * =========================================================
 *
 * This file re-exports the full schema package so the rest
 * of the application can import from a single source.
 *
 * Example:
 * import { Resume, ResumeVersion, ScoreSnapshot } from '@/core/schema';
 *
 * =========================================================
 */

export * from './enums';
export * from './primitives';
export * from './resume-content';
export * from './job-description-content';
export * from './score';
export * from './common';
export * from './relationships';
export * from './validation-rules';
export * from './sample-payloads';

export * from './entities/user';
export * from './entities/resume';
export * from './entities/resume-version';
export * from './entities/job-description';
export * from './entities/resume-scan';
export * from './entities/match-analysis';
export * from './entities/career-suggestion';
export * from './entities/interview-prep';
export * from './entities/application';