import { AuditLog, User } from '@ai-ticket/shared-schema';

export async function getAuditLogs(query: Record<string, any>): Promise<{
  logs: Array<Record<string, any>>;
  total: number;
  limit: number;
  offset: number;
}> {
  const { ticketId, userId, action, limit = '50', offset = '0' } = query;
  const where: Record<string, any> = {};
  if (ticketId) where.ticketId = ticketId;
  if (userId) where.userId = userId;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    AuditLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
    }),
    AuditLog.count({ where }),
  ]);

  return { logs: logs as Array<Record<string, any>>, total, limit: parseInt(limit, 10), offset: parseInt(offset, 10) };
}
