import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestIdMiddleware } from '@ai-ticket/shared-lib';
import config from './config';
import { logger } from './logger';
import { errorHandler } from './rest/middlewares/error-handler';
import { ticketRoutes } from './rest/modules/tickets/v1/routes';
import { teamRoutes } from './rest/modules/teams/v1/routes';
import { auditRoutes } from './rest/modules/audit/v1/routes';
import { bootstrap } from './boot';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());
app.use(requestIdMiddleware());

app.get('/health', async (_req: any, res: any) => {
  let dbStatus = 'unknown';
  try {
    const { sequelize } = await import('@ai-ticket/shared-schema');
    await sequelize.authenticate();
    dbStatus = 'up';
  } catch {
    dbStatus = 'down';
  }

  const healthy = dbStatus === 'up';
  (res as any).status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    service: config.serviceName,
    timestamp: new Date().toISOString(),
    checks: { database: dbStatus },
  });
});

app.get('/metrics', async (_req: any, res: any) => {
  (res as any).set('Content-Type', 'text/plain');
  (res as any).send('# TODO: prom-client metrics\n');
});

app.use('/v1/tickets', ticketRoutes);
app.use('/v1/teams', teamRoutes);
app.use('/v1/audit', auditRoutes);

app.use(errorHandler);

bootstrap()
  .then(() => {
    app.listen(config.port, () => {
      logger.info(`Core server listening on port ${config.port}`);
    });
  })
  .catch((err) => {
    logger.error('Bootstrap failed, server not started', { error: (err as Error).message });
    process.exit(1);
  });

export default app;
