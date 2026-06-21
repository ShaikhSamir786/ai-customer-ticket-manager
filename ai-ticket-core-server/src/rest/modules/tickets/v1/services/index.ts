import { Ticket, AuditLog, Team, User, TicketMessage, OverrideHistory } from '@ai-ticket/shared-schema';
import { sequelize } from '@ai-ticket/shared-schema';
import { NotFoundError, ValidationError, paginationSchema } from '@ai-ticket/shared-lib';
import type { OverrideAuditMetadata } from '@ai-ticket/shared-schema';
import { Queue } from 'bullmq';
import { logger } from '../../../../../logger';
import config from '../../../../../config';
import connection from '../../../../../redis-client';
import type { CreateTicketDTO, TicketQueryParams, TicketUpdateData, TriageUpdateData } from '../../../../../types/dto';

function getQueue() {
  return new Queue('ticket-triage', { connection });
}

export async function createTicket(data: CreateTicketDTO) {
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

export async function getTickets(query: TicketQueryParams) {
  const { status, priority, assignedTeamId, assignedAgentId } = query;

  const parsed = paginationSchema.safeParse({
    page: Math.floor(parseInt(query.offset || '0', 10) / parseInt(query.limit || '50', 10)) + 1,
    limit: parseInt(query.limit || '50', 10),
  });

  const limit = parsed.success ? parsed.data.limit : 50;
  const page = parsed.success ? parsed.data.page : 1;
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignedTeamId) where.assignedTeamId = assignedTeamId;
  if (assignedAgentId) where.assignedAgentId = assignedAgentId;

  const { rows: tickets, count: total } = await Ticket.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: [
      { model: Team, as: 'assignedTeam' },
      { model: User, as: 'assignedAgent' },
      { model: TicketMessage, as: 'messages', limit: 1, order: [['createdAt', 'DESC']] },
    ],
  });

  return { tickets, total, limit, offset, page };
}

export async function getTicket(id: string) {
  const ticket = await Ticket.findByPk(id, {
    include: [
      { model: Team, as: 'assignedTeam' },
      { model: User, as: 'assignedAgent' },
      { model: TicketMessage, as: 'messages', order: [['createdAt', 'ASC']] },
      { model: OverrideHistory, as: 'overrideHistory', order: [['createdAt', 'DESC']], limit: 10 },
    ],
  });

  if (!ticket) throw new NotFoundError('Ticket', id);
  return ticket;
}

export async function updateTicket(id: string, data: TicketUpdateData) {
  const ticket = await Ticket.findByPk(id);
  if (!ticket) throw new NotFoundError('Ticket', id);

  const updateData: Record<string, unknown> = {};
  const allowedFields = ['status', 'priority', 'category', 'assignedTeamId', 'assignedAgentId', 'needsHumanReview', 'overrideReason'];

  for (const field of allowedFields) {
    if (data[field as keyof TicketUpdateData] !== undefined) updateData[field] = data[field as keyof TicketUpdateData];
  }

  if (data.status === 'resolved') {
    updateData.resolvedAt = new Date();
  }

  await sequelize.transaction(async (tx) => {
    await Ticket.update(updateData, { where: { id }, transaction: tx });

    await AuditLog.create({
      ticketId: id,
      userId: data.updatedByAgentId,
      action: 'ticket.updated',
      entity: 'ticket',
      entityId: id,
      metadata: { changes: updateData } satisfies OverrideAuditMetadata,
    }, { transaction: tx });
  });

  return Ticket.findByPk(id);
}

export async function updateTicketTriage(data: TriageUpdateData) {
  const { ticketId, ...triageData } = data;
  const ticket = await Ticket.findByPk(ticketId);
  if (!ticket) throw new NotFoundError('Ticket', ticketId);

  const updateData = {
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

  await sequelize.transaction(async (tx) => {
    await Ticket.update(updateData, { where: { id: ticketId }, transaction: tx });

    await AuditLog.create({
      ticketId,
      action: 'triage.completed',
      entity: 'ticket',
      entityId: ticketId,
      metadata: { triage: triageData } satisfies OverrideAuditMetadata,
    }, { transaction: tx });
  });

  return Ticket.findByPk(ticketId);
}
