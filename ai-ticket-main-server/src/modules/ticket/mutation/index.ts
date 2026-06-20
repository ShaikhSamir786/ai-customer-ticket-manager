import { proxyCreateTicket, proxyUpdateTicket } from '../../../rest/modules/tickets/v1/services';
import { formatAppError, requireAuth } from '../../helpers';
import type { GraphQLContext } from '../../../context';

export const ticketMutations = {
  createTicket: async (_: unknown, args: { input: { subject: string; message: string; customerId?: string; source?: string } }, context: GraphQLContext) => {
    const user = requireAuth(context);
    try { return await proxyCreateTicket(args.input, user); }
    catch (err) { formatAppError(err); }
  },
  updateTicket: async (_: unknown, args: { id: string; input: Record<string, unknown> }, context: GraphQLContext) => {
    const user = requireAuth(context);
    try { return await proxyUpdateTicket(args.id, args.input, user); }
    catch (err) { formatAppError(err); }
  },
};
