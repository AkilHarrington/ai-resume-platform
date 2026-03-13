/**
 * =========================================================
 * API CONTROLLER - RESUME
 * =========================================================
 *
 * Purpose:
 * Thin HTTP controllers for resume scan + optimize flows.
 *
 * Responsibilities:
 * - validate request input
 * - call services/orchestrators
 * - return HTTP responses
 *
 * Notes:
 * - scan = parse + score + job intelligence
 * - optimize = full resume intelligence orchestrator
 * =========================================================
 */

import type { Request, Response } from "express";
import { runResumeIntelligence } from "../services/resume-intelligence/resume-intelligence-orchestrator";
import { parseResumeText } from "../services/resume-parser/parser-pipeline";
import { scoreResume } from "../services/resume-scoring/scoring-pipeline";
import { runJobIntelligence } from "../services/job-intelligence/job-intelligence-pipeline";

interface ResumeRequestBody {
  rawText?: string;
  jobDescription?: string;
}

export function optimizeResumeController(
  req: Request<unknown, unknown, ResumeRequestBody>,
  res: Response
): void {
  try {
    const rawText = req.body?.rawText?.trim();
    const jobDescription = req.body?.jobDescription?.trim() || "";

    if (!rawText) {
      res.status(400).json({
        success: false,
        error: "rawText is required."
      });
      return;
    }

    const result = runResumeIntelligence({
      rawText,
      jobDescription
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("optimizeResumeController error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to process resume intelligence pipeline."
    });
  }
}

export function scanResumeController(
  req: Request<unknown, unknown, ResumeRequestBody>,
  res: Response
): void {
  try {
    const rawText = req.body?.rawText?.trim();
    const jobDescription = req.body?.jobDescription?.trim() || "";

    if (!rawText) {
      res.status(400).json({
        success: false,
        error: "rawText is required."
      });
      return;
    }

    const parser = parseResumeText({ rawText });

    const scoring = scoreResume({
      rawText,
      contentJson: parser.output.contentJson
    });

    const jobIntelligence =
      jobDescription.length > 0
        ? runJobIntelligence({
            jobDescription,
            resumeText: rawText
          })
        : undefined;

    res.status(200).json({
      success: true,
      data: {
        rawText,
        parser: parser.output,
        scoring,
        jobIntelligence
      }
    });
  } catch (error) {
    console.error("scanResumeController error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to process resume scan pipeline."
    });
  }
}