import { Ticket, AuditLog, Team, User, TicketMessage } from '@ai-ticket/shared-schema';
import { Op } from '@ai-ticket/shared-schema';
import { NotFoundError, ValidationError } from '@ai-ticket/shared-lib';
import { Queue } from 'bullmq';
import { logger } from '../../../../../logger';

function getQueue() {
  return new Queue('ticket-triage', { connection: { host: 'localhost', port: 6379 } });
}

export async function createTicket(data: {
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  subject: string;
  message: string;
  sourceChannel?: string;
  customerTier?: string;
  createdByAgentId?: string;
}) {
  if (!data.customerId || !data.subject || !data.message) {
    throw new ValidationError('customerId, subject, and message are required');
  }

  const ticket = await Ticket.create({
    customerId: data.customerId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    subject: data.subject,
    message: data.message,
    sourceChannel: data.sourceChannel || 'web',
    customerTier: data.customerTier || 'standard',
    createdByAgentId: data.createdByAgentId,
  });

  try {
    const queue = getQueue();
    await queue.add('process-ticket', { ticketId: ticket.id });
    logger.info('Enqueued triage job', { ticketId: ticket.id });
  } catch (err) {
    logger.warn('Failed to enqueue triage job, ticket created without queuing', { ticketId: ticket.id, error: err });
  }

  return ticket;
}

export async function getTickets(query: Record<string, any>) {
  const { status, priority, assignedTeamId, assignedAgentId, limit = '50', offset = '0' } = query;
  const where: Record<string, any> = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignedTeamId) where.assignedTeamId = assignedTeamId;
  if (assignedAgentId) where.assignedAgentId = assignedAgentId;

  const [tickets, total] = await Promise.all([
    Ticket.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      include: [
        { model: Team, as: 'assignedTeam' },
        { model: User, as: 'assignedAgent' },
        { model: TicketMessage, as: 'messages', limit: 1, order: [['createdAt', 'DESC']] },
      ],
    }),
    Ticket.count({ where }),
  ]);

  return { tickets, total, limit: parseInt(limit, 10), offset: parseInt(offset, 10) };
}

export async function getTicket(id: string) {
  const ticket = await Ticket.findByPk(id, {
    include: [
      { model: Team, as: 'assignedTeam' },
      { model: User, as: 'assignedAgent' },
      { model: TicketMessage, as: 'messages', order: [['createdAt', 'ASC']] },
      { model: Ticket.sequelize!.model('OverrideHistory') as any, as: 'overrideHistory', order: [['createdAt', 'DESC']], limit: 10 },
    ],
  });

  if (!ticket) throw new NotFoundError('Ticket', id);
  return ticket;
}

export async function updateTicket(id: string, data: Record<string, any>) {
  const ticket = await Ticket.findByPk(id);
  if (!ticket) throw new NotFoundError('Ticket', id);

  const updateData: Record<string, any> = {};
  const allowedFields = ['status', 'priority', 'category', 'assignedTeamId', 'assignedAgentId', 'needsHumanReview', 'overrideReason'];

  for (const field of allowedFields) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  if (data.status === 'resolved') {
    updateData.resolvedAt = new Date();
  }

  await Ticket.update(updateData, { where: { id } });

  await AuditLog.create({
    ticketId: id,
    userId: data.updatedByAgentId,
    action: 'ticket.updated',
    entity: 'ticket',
    entityId: id,
    metadata: { changes: updateData } as any,
  });

  return Ticket.findByPk(id);
}

export async function updateTicketTriage(data: {
  ticketId: string;
  category: string;
  priority: string;
  sentiment: string;
  assignedTeam: string;
  confidence: number;
  needsHumanReview: boolean;
  suggestedReply: string;
  modelUsed: string;
  churnRisk?: number;
}) {
  const { ticketId, ...triageData } = data;
  const ticket = await Ticket.findByPk(ticketId);
  if (!ticket) throw new NotFoundError('Ticket', ticketId);

  const updateData: Record<string, any> = {
    category: triageData.category,
    priority: triageData.priority,
    sentiment: triageData.sentiment,
    assignedTeamId: triageData.assignedTeam,
    confidence: triageData.confidence,
    needsHumanReview: triageData.needsHumanReview,
    suggestedReply: triageData.suggestedReply,
    modelUsed: triageData.modelUsed,
    churnRisk: triageData.churnRisk,
    status: triageData.needsHumanReview ? 'triaged' : 'assigned',
  };

  await Ticket.update(updateData, { where: { id: ticketId } });

  await AuditLog.create({
    ticketId,
    action: 'triage.completed',
    entity: 'ticket',
    entityId: ticketId,
    metadata: { triage: triageData } as any,
  });

  return Ticket.findByPk(ticketId);
}


