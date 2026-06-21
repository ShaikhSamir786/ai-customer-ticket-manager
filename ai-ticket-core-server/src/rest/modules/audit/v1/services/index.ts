import { AuditLog, User } from '@ai-ticket/shared-schema';
import type { AuditQueryParams } from '../../../../../types/dto';

export async function getAuditLogs(query: AuditQueryParams) {
  const { ticketId, userId, action, limit: limitStr = '50', offset: offsetStr = '0' } = query;
  const limit = parseInt(limitStr, 10);
  const offset = parseInt(offsetStr, 10);

  const where: { ticketId?: string; userId?: string; action?: string } = {};
  if (ticketId) where.ticketId = ticketId;
  if (userId) where.userId = userId;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    AuditLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
    }),
    AuditLog.count({ where }),
  ]);

  return { logs, total, limit, offset };
}
