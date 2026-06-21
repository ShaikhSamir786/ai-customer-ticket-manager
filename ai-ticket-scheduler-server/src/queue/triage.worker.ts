import { Worker } from 'bullmq';
import { logger } from '../logger';
import connection from '../redis/connection';
import { triageJobHandler } from '../handlers/triage.handler';
import { deadLetterHandler } from '../handlers/dead-letter.handler';

export function startWorkers() {
  const worker = new Worker('ticket-triage', triageJobHandler, {
    connection: connection as any,
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    logger.info('Triage job completed', { jobId: job.id, ticketId: job.data.ticketId });
  });

  worker.on('failed', async (job, err) => {
    if (!job) return;
    logger.error('Triage job failed', { jobId: job.id, ticketId: job.data.ticketId, error: err.message, attempts: job.attemptsMade });

    if (job.attemptsMade >= (job.opts?.attempts || 3)) {
      await deadLetterHandler(job.data.ticketId, err.message);
    }
  });

  logger.info('BullMQ worker started for queue: ticket-triage');
  return worker;
}
