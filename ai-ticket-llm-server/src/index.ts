import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import { logger } from './logger';
import { errorHandler } from './rest/middlewares/error-handler';
import { analyzeRoutes } from './rest/modules/analyze/v1/routes';
import { promptRoutes } from './rest/modules/prompts/v1/routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: config.serviceName, timestamp: new Date().toISOString() });
});

app.use('/v1/analyze', analyzeRoutes);
app.use('/v1/prompts', promptRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`LLM server listening on port ${config.port}`);
});

export default app;
