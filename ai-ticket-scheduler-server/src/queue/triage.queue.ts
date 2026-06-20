import { Queue, type ConnectionOptions } from 'bullmq';
import { DEFAULT_JOB_OPTIONS } from '../constant/service-constant';
import connection from '../redis/connection';

export const triageQueue = new Queue('ticket-triage', {
  connection: connection as ConnectionOptions,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});
