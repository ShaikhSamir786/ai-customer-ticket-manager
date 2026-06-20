import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: config.serviceName, timestamp: new Date().toISOString() });
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
