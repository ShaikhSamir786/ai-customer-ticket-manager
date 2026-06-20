import { loadConfig } from '@ai-ticket/shared-lib';

const config = loadConfig();

function envInt(key: string, fallback: number): number {
  const val = process.env[key];
  return val ? parseInt(val, 10) : fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const val = process.env[key];
  if (val === undefined) return fallback;
  return val === 'true' || val === '1';
}

export default {
  ...config,
  port: envInt('SCHEDULER_SERVER_PORT', 3004),
  serviceName: 'scheduler-server',
  coreServerUrl: process.env.CORE_SERVER_URL || 'http://localhost:3001',
  processorServerUrl: process.env.PROCESSOR_SERVER_URL || 'http://localhost:3002',
  staleTicketScanCron: process.env.STALE_TICKET_SCAN_CRON || '*/15 * * * *',
  staleTicketThresholdMs: envInt('STALE_TICKET_THRESHOLD_MS', 7 * 24 * 60 * 60 * 1000),
  slaCheckCron: process.env.SLA_CHECK_CRON || '*/5 * * * *',
  slaThresholdMs: envInt('SLA_THRESHOLD_MS', 4 * 60 * 60 * 1000),
  metricsSnapshotCron: process.env.METRICS_SNAPSHOT_CRON || '0 */6 * * *',

  redisMaxRetriesPerRequest: process.env.REDIS_MAX_RETRIES_PER_REQUEST
    ? parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST, 10)
    : null,
  redisConnectTimeout: envInt('REDIS_CONNECT_TIMEOUT_MS', 10000),
  redisMaxRetryAttempts: envInt('REDIS_MAX_RETRY_ATTEMPTS', 10),
  redisRetryDelay: envInt('REDIS_RETRY_DELAY_MS', 1000),
  redisKeepAlive: envInt('REDIS_KEEPALIVE_MS', 30000),
  redisEnableReadyCheck: envBool('REDIS_ENABLE_READY_CHECK', true),
  redisTlsEnabled: envBool('REDIS_TLS_ENABLED', false),
  redisPort: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
};
