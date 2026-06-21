import { proxyGetTickets, proxyGetTicket } from '../../../rest/modules/tickets/v1/services';
import { formatAppError, requireAuth } from '../../helpers';
import type { GraphQLContext } from '../../../context';
import type { TicketListResult } from '../../../types/dto';

export const ticketQueries = {
  tickets: async (_: unknown, args: { status?: string; priority?: string; assignedTeam?: string; page?: number; limit?: number }, context: GraphQLContext) => {
    requireAuth(context);
    try {
      const result: TicketListResult = await proxyGetTickets(args);
      return {
        nodes: result.tickets,
        totalCount: result.total,
        hasNextPage: result.page * result.limit < result.total,
        hasPreviousPage: result.page > 1,
        page: result.page,
        limit: result.limit,
      };
    }
    catch (err) { formatAppError(err); }
  },
  ticket: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
    requireAuth(context);
    try { return await proxyGetTicket(args.id); }
    catch (err) { formatAppError(err); }
  },
};
