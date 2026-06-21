import { Queue } from 'bullmq';
import { DEFAULT_JOB_OPTIONS } from '../constant/service-constant';
import connection from '../redis/connection';

export const triageQueue = new Queue('ticket-triage', {
  connection: connection as any,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});
