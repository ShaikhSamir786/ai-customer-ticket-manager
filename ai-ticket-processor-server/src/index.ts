import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestIdMiddleware } from '@ai-ticket/shared-lib';
import config from './config';
import { logger } from './logger';
import { errorHandler } from './rest/middlewares/error-handler';
import { triageRoutes } from './rest/modules/triage/v1/routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());
app.use(requestIdMiddleware());

app.get('/health', async (_req: any, res: any) => {
  let coreStatus = 'unknown';
  let llmStatus = 'unknown';
  try {
    const axios = (await import('axios')).default;
    await axios.get(`${config.coreServerUrl}/health`, { timeout: 5000 });
    coreStatus = 'up';
  } catch {
    coreStatus = 'down';
  }
  try {
    const axios = (await import('axios')).default;
    await axios.get(`${config.llmServerUrl}/health`, { timeout: 5000 });
    llmStatus = 'up';
  } catch {
    llmStatus = 'down';
  }

  const healthy = coreStatus === 'up';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    service: config.serviceName,
    timestamp: new Date().toISOString(),
    checks: { coreServer: coreStatus, llmServer: llmStatus },
  });
});

app.use('/v1/triage', triageRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`Processor server listening on port ${config.port}`);
});

export default app;
