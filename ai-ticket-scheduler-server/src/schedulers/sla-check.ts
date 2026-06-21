import { Ticket, AuditLog, Op } from '@ai-ticket/shared-schema';
import { logger } from '../logger';
import config from '../config/config';
import { STATUS, AUDIT_ACTION, AUDIT_ENTITY } from '../constant/service-constant';
import { registerScheduler } from './scheduler-registry';

interface SlaBreachMetadata {
  createdAt: Date;
  currentStatus: string;
}

const BATCH_SIZE = 500;

export function startSlaCheck() {
  registerScheduler('SLA Breach Check', config.slaCheckCron, async () => {
    let offset = 0;
    let totalBreached = 0;

    while (true) {
      const batch = await Ticket.findAll({
        where: {
          status: { [Op.in]: [STATUS.PENDING, STATUS.TRIAGING, STATUS.ASSIGNED] },
          createdAt: { [Op.lte]: new Date(Date.now() - config.slaThresholdMs) },
        },
        limit: BATCH_SIZE,
        offset,
      });

      if (batch.length === 0) break;

      const audits = batch.map(ticket => ({
        ticketId: ticket.id,
        action: AUDIT_ACTION.SLA_BREACHED,
        entity: AUDIT_ENTITY.TICKET,
        entityId: ticket.id,
        metadata: { createdAt: ticket.createdAt, currentStatus: ticket.status } satisfies SlaBreachMetadata,
      }));

      await AuditLog.bulkCreate(audits);
      totalBreached += batch.length;
      logger.warn('SLA breach batch', { count: batch.length, offset, total: totalBreached });
      offset += BATCH_SIZE;
    }

    if (totalBreached > 0) {
      logger.warn('SLA breach check complete', { totalBreached });
    }
  });
}
