/**
 * =========================================================
 * API INDEX
 * =========================================================
 */

import { Router } from 'express';
import resumeRoutes from './routes/resume.routes';

const apiRouter = Router();

apiRouter.use('/resume', resumeRoutes);

export default apiRouter;