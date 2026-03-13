/**
 * =========================================================
 * API ROUTES - RESUME
 * =========================================================
 *
 * PURPOSE:
 *
 * Defines the HTTP routes for resume-related API actions.
 *
 * In v1, this route file exposes:
 *
 *   POST /api/resume/optimize
 *
 * which runs the full resume-intelligence pipeline.
 *
 * =========================================================
 */

import { Router } from 'express';
import {
  optimizeResumeController,
  scanResumeController,
} from '../../controllers/resume.controller';

const router = Router();


/**
 * Run full resume-intelligence pipeline.
 */
router.post('/optimize', optimizeResumeController);

export default router;

/**
 * Run lightweight resume scan pipeline.
 */
router.post('/scan', scanResumeController);