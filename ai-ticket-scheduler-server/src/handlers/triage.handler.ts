import { Job } from 'bullmq';
import crypto from 'crypto';
import { logger } from '../logger';
import { callProcessorService } from '../adapters/processor-adapter';

export async function triageJobHandler(job: Job) {
  const correlationId = crypto.randomUUID();
  const { ticketId } = job.data;
  const startTime = Date.now();

  logger.info('Processing triage job', {
    jobId: job.id,
    ticketId,
    correlationId,
    attempt: job.attemptsMade + 1,
    maxAttempts: job.opts?.attempts || 3,
  });

  const result = await callProcessorService(ticketId, correlationId);

  const duration = Date.now() - startTime;
  logger.info('Triage job completed', {
    jobId: job.id,
    ticketId,
    correlationId,
    durationMs: duration,
    attempt: job.attemptsMade + 1,
  });

  return result;
}
