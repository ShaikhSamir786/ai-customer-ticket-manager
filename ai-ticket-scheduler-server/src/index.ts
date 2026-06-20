import express from 'express';
import { startWorkers } from './queue/triage.worker';
import { startSchedulers } from './schedulers';
import { stopAllSchedulers } from './schedulers/scheduler-registry';
import { setupBullBoard } from './bull-board';
import { checkRedisHealth } from './redis/connection.health';
import { logger } from './logger';
import config from './config/config';
import connection from './redis/connection';

logger.info('Starting scheduler server', { service: config.serviceName });

const worker = startWorkers();
startSchedulers();

const app = express();
app.use('/admin/queues', setupBullBoard());

app.get('/health', async (_req, res) => {
  const redisHealthy = await checkRedisHealth();
  const status = redisHealthy ? 'healthy' : 'degraded';
  res.status(redisHealthy ? 200 : 503).json({
    status,
    service: config.serviceName,
    timestamp: new Date().toISOString(),
    checks: {
      redis: redisHealthy ? 'up' : 'down',
      worker: worker.isRunning() ? 'running' : 'stopped',
    },
  });
});

const server = app.listen(config.port, () => {
  logger.info('Scheduler server initialized', { port: config.port });
  logger.info('Bull Board UI available', { url: `http://localhost:${config.port}/admin/queues` });
});


const handleShutdown = async () => {
  logger.info('Shutting down scheduler server');
  server.close();
  await worker.close();
  stopAllSchedulers();
  connection.disconnect();
  process.exit(0);
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

