import { proxyGetTickets, proxyGetTicket } from '../../../rest/modules/tickets/v1/services';
import { formatAppError, requireAuth } from '../../helpers';
import type { GraphQLContext } from '../../../context';

export const ticketQueries = {
  tickets: async (_: unknown, args: { status?: string; priority?: string; assignedTeam?: string; page?: number; limit?: number }, context: GraphQLContext) => {
    requireAuth(context);
    try { return await proxyGetTickets(args); }
    catch (err) { formatAppError(err); }
  },
  ticket: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
    requireAuth(context);
    try { return await proxyGetTicket(args.id); }
    catch (err) { formatAppError(err); }
  },
};
