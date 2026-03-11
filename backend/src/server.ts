/**
 * =========================================================
 * SERVER ENTRYPOINT
 * =========================================================
 *
 * PURPOSE:
 *
 * This file starts the Express server and mounts the API.
 *
 * =========================================================
 */

import express from 'express';
import apiRouter from './api';

const app = express();

/**
 * Parse JSON bodies
 */
app.use(express.json());

/**
 * Mount API routes
 */
app.use('/api', apiRouter);

/**
 * Health check route
 */
app.get('/', (_, res) => {
  res.json({
    status: 'AI Resume Platform API running',
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});