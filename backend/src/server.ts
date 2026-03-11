import express from 'express';
import cors from 'cors';
import apiRouter from './api';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);

app.get('/', (_, res) => {
  res.json({
    status: 'AI Resume Platform API running',
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});