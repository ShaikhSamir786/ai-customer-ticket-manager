import { Ticket, AuditLog } from '@ai-ticket/shared-schema';
import { logger } from '../logger';
import config from '../config/config';
import { STATUS, AUDIT_ACTION, AUDIT_ENTITY } from '../constant/service-constant';
import { registerScheduler } from './scheduler-registry';

interface MetricsSnapshotMetadata {
  pending: number;
  inProgress: number;
  resolved: number;
  needsReview: number;
  timestamp: string;
}

export function startMetricsSnapshot() {
  registerScheduler('Metrics Snapshot', config.metricsSnapshotCron, async () => {
    const results = await Promise.allSettled([
      Ticket.count({ where: { status: STATUS.PENDING } }),
      Ticket.count({ where: { status: STATUS.IN_PROGRESS } }),
      Ticket.count({ where: { status: STATUS.RESOLVED } }),
      Ticket.count({ where: { needsHumanReview: true } }),
    ]);

    const [pending, inProgress, resolved, needsReview] = results.map(r =>
      r.status === 'fulfilled' ? r.value : 0,
    );

    await AuditLog.create({
      action: AUDIT_ACTION.METRICS_SNAPSHOT,
      entity: AUDIT_ENTITY.SYSTEM,
      entityId: 'metrics',
      metadata: {
        pending,
        inProgress,
        resolved,
        needsReview,
        timestamp: new Date().toISOString(),
      } satisfies MetricsSnapshotMetadata,
    });
  });
}
