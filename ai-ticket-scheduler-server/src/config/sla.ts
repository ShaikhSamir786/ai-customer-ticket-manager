import config from './config';

export const SLA_CONFIG = {
  CHECK_CRON: config.slaCheckCron,
  THRESHOLD_MS: config.slaThresholdMs,
  STALE_SCAN_CRON: config.staleTicketScanCron,
  STALE_THRESHOLD_MS: config.staleTicketThresholdMs,
};
