import { startSlaCheck } from './sla-check';
import { startStaleTicketScan } from './stale-ticket-scan';
import { startMetricsSnapshot } from './metrics-snapshot';

const STAGGER_MS = 5000;

export function startSchedulers() {
  startSlaCheck();
  setTimeout(() => startStaleTicketScan(), STAGGER_MS);
  setTimeout(() => startMetricsSnapshot(), STAGGER_MS * 2);
}
