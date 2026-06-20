import { Ticket, AuditLog } from '@ai-ticket/shared-schema';
import { logger } from '../logger';
import { STATUS, AUDIT_ACTION, AUDIT_ENTITY } from '../constant/service-constant';

interface DeadLetterMetadata {
  error: string;
}

export async function deadLetterHandler(ticketId: string, errorMessage: string) {
  logger.warn('Moving ticket to dead letter queue', { ticketId, error: errorMessage });

  try {
    await Ticket.update(
      { status: STATUS.ERROR_REQUIRES_MANUAL, overrideReason: `Triage failed: ${errorMessage}` },
      { where: { id: ticketId } },
    );

    await AuditLog.create({
      ticketId,
      action: AUDIT_ACTION.TRIAGE_DEAD_LETTER,
      entity: AUDIT_ENTITY.TICKET,
      entityId: ticketId,
      metadata: { error: errorMessage } satisfies DeadLetterMetadata,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to update ticket for dead letter', { ticketId, error: message });
    throw err;
  }
}
