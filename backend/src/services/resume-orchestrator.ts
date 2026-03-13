// =====================================================
// RESUME ORCHESTRATOR
// Shared pipeline helpers for scan + optimize flows
// =====================================================

import { parseResumeText } from "./resume-parser/parser-pipeline";
import { scoreResume } from "./resume-scoring/scoring-pipeline";
import { runJobIntelligence } from "./job-intelligence/job-intelligence-pipeline";
import { runResumeIntelligence } from "./resume-intelligence/resume-intelligence-orchestrator";
import { saveResumeVersion } from "./resume-version-store";

export interface ResumePipelineInput {
  rawText: string;
  jobDescription?: string;
}

function createResumeId(): string {
  return `resume_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createVersionId(): string {
  return `version_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function runResumeScanPipeline(input: ResumePipelineInput) {
  const { rawText, jobDescription = "" } = input;

  const resumeId = createResumeId();

  const parser = parseResumeText({ rawText });

  const scoring = scoreResume({
    rawText,
    contentJson: parser.output.contentJson,
  });

  saveResumeVersion({
    versionId: createVersionId(),
    resumeId,
    createdAt: Date.now(),
    source: "original",
    rawText,
    contentJson: parser.output.contentJson,
    scoreSnapshot: {
      overall: scoring.scoreSnapshot.overall,
    },
  });

  const jobIntelligence =
    jobDescription.trim().length > 0
      ? runJobIntelligence({
          jobDescription,
          resumeText: rawText,
        })
      : undefined;

  return {
    resumeId,
    parser: parser.output,
    scoring,
    jobIntelligence,
  };
}

export function runResumeOptimizePipeline(input: ResumePipelineInput) {
  const { rawText, jobDescription = "" } = input;

  const result = runResumeIntelligence({
    rawText,
    jobDescription,
  });

  const resumeId = createResumeId();

  saveResumeVersion({
    versionId: createVersionId(),
    resumeId,
    createdAt: Date.now(),
    source: "original",
    rawText,
    contentJson: result.parser.contentJson,
    scoreSnapshot: {
      overall: result.originalScoring.scoreSnapshot.overall,
    },
  });

  saveResumeVersion({
    versionId: createVersionId(),
    resumeId,
    createdAt: Date.now(),
    source: "optimized",
    rawText,
    contentJson: result.optimizer.optimizedContentJson,
    scoreSnapshot: {
      overall: result.optimizedScoring.scoreSnapshot.overall,
    },
  });

  return {
    resumeId,
    ...result,
  };
}