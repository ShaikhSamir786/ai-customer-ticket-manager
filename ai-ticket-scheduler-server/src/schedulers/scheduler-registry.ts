import cron from 'node-cron';
import crypto from 'crypto';
import { logger } from '../logger';

const activeTasks = new Map<string, cron.ScheduledTask>();

export function registerScheduler(name: string, cronExpression: string, taskFunction: () => Promise<void> | void) {
  logger.info(`Registering scheduler task: ${name} with schedule: ${cronExpression}`);

  const task = cron.schedule(cronExpression, async () => {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();
    logger.info('Scheduler task started', { task: name, correlationId, cronExpression });

    try {
      await taskFunction();
      const duration = Date.now() - startTime;
      logger.info('Scheduler task completed', { task: name, correlationId, durationMs: duration, status: 'success' });
    } catch (err: unknown) {
      const duration = Date.now() - startTime;
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Scheduler task failed', { task: name, correlationId, durationMs: duration, status: 'failed', error: message });
    }
  });

  activeTasks.set(name, task);
  return task;
}

export function getActiveSchedulers() {
  return Array.from(activeTasks.keys());
}

export function stopAllSchedulers() {
  for (const [name, task] of activeTasks.entries()) {
    logger.info('Stopping scheduler task', { task: name });
    task.stop();
  }
  activeTasks.clear();
}
