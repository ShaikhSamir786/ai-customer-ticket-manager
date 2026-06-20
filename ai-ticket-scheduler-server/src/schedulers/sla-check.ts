import { Ticket, AuditLog, Op } from '@ai-ticket/shared-schema';
import { logger } from '../logger';
import config from '../config/config';
import { STATUS, AUDIT_ACTION, AUDIT_ENTITY } from '../constant/service-constant';
import { registerScheduler } from './scheduler-registry';

interface SlaBreachMetadata {
  createdAt: Date;
  currentStatus: string;
}

export function startSlaCheck() {
  registerScheduler('SLA Breach Check', config.slaCheckCron, async () => {
    const pendingTickets = await Ticket.findAll({
      where: {
        status: { [Op.in]: [STATUS.PENDING, STATUS.TRIAGING, STATUS.ASSIGNED] },
        createdAt: { [Op.lte]: new Date(Date.now() - config.slaThresholdMs) },
      },
    });

    for (const ticket of pendingTickets) {
      await AuditLog.create({
        ticketId: ticket.id,
        action: AUDIT_ACTION.SLA_BREACHED,
        entity: AUDIT_ENTITY.TICKET,
        entityId: ticket.id,
        metadata: { createdAt: ticket.createdAt, currentStatus: ticket.status } satisfies SlaBreachMetadata,
      });
      logger.warn('SLA breach detected', { ticketId: ticket.id });
    }
  });
}
