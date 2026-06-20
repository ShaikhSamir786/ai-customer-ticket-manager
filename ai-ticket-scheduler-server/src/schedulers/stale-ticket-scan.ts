import { Ticket, Op } from '@ai-ticket/shared-schema';
import { logger } from '../logger';
import config from '../config/config';
import { STATUS } from '../constant/service-constant';
import { registerScheduler } from './scheduler-registry';

export function startStaleTicketScan() {
  registerScheduler('Stale Ticket Scan', config.staleTicketScanCron, async () => {
    const cutoffDate = new Date(Date.now() - config.staleTicketThresholdMs);

    const [affectedCount] = await Ticket.update(
      { status: STATUS.CLOSED },
      {
        where: {
          status: STATUS.WAITING_CUSTOMER,
          updatedAt: { [Op.lte]: cutoffDate },
        },
      },
    );

    logger.info('Auto-closed stale tickets', { count: affectedCount });
  });
}
