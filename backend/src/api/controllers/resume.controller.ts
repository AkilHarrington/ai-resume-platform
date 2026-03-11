/**
 * =========================================================
 * API CONTROLLER - RESUME
 * =========================================================
 *
 * PURPOSE:
 *
 * This controller handles HTTP requests related to the
 * resume-intelligence flow.
 *
 * In v1, this controller exposes a single high-value action:
 *
 *   POST /api/resume/optimize
 *
 * which runs the full pipeline:
 *
 *   parse → score → optimize → rescore → compare
 *
 * IMPORTANT:
 *
 * Controllers should stay thin.
 *
 * They should:
 * - validate request shape lightly
 * - call orchestrator/services
 * - shape HTTP responses
 * - handle errors safely
 *
 * They should NOT contain deep business logic.
 *
 * =========================================================
 */

import type { Request, Response } from 'express';
import { runResumeIntelligence } from '../../services/resume-intelligence/resume-intelligence-orchestrator';
import { parseResumeText } from '../../services/resume-parser/parser-pipeline';
import { scoreResume } from '../../services/resume-scoring/scoring-pipeline';


/**
 * ---------------------------------------------------------
 * REQUEST BODY TYPE
 * ---------------------------------------------------------
 *
 * Minimal request body for v1 resume intelligence flow.
 */
interface OptimizeResumeRequestBody {
  rawText?: string;
}


/**
 * ---------------------------------------------------------
 * POST /api/resume/optimize
 * ---------------------------------------------------------
 *
 * Runs the full resume-intelligence pipeline using raw
 * resume text provided by the client.
 *
 * Request body:
 * {
 *   rawText: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     parser: ...,
 *     originalScoring: ...,
 *     optimizer: ...,
 *     optimizedScoring: ...,
 *     comparison: ...
 *   }
 * }
 */
export function optimizeResumeController(
  req: Request<unknown, unknown, OptimizeResumeRequestBody>,
  res: Response,
): void {
  try {
    const rawText = req.body?.rawText?.trim();

    if (!rawText) {
      res.status(400).json({
        success: false,
        error: 'rawText is required.',
      });
      return;
    }

    const result = runResumeIntelligence({ rawText });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('optimizeResumeController error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to process resume intelligence pipeline.',
    });
  }
}

/**
 * ---------------------------------------------------------
 * POST /api/resume/scan
 * ---------------------------------------------------------
 *
 * Runs the lightweight resume scan pipeline:
 *
 *   parse → score
 *
 * Request body:
 * {
 *   rawText: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     parser: ...,
 *     scoring: ...
 *   }
 * }
 */
export function scanResumeController(
  req: Request<unknown, unknown, OptimizeResumeRequestBody>,
  res: Response,
): void {
  try {
    const rawText = req.body?.rawText?.trim();

    if (!rawText) {
      res.status(400).json({
        success: false,
        error: 'rawText is required.',
      });
      return;
    }

    const parser = parseResumeText({ rawText });

    const scoring = scoreResume({
      rawText,
      contentJson: parser.output.contentJson,
    });

    res.status(200).json({
      success: true,
      data: {
        parser: parser.output,
        scoring,
      },
    });
  } catch (error) {
    console.error('scanResumeController error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to process resume scan pipeline.',
    });
  }
}