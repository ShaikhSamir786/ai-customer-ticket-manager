import axios from 'axios';
import config from '../../../../../config';
import { logger } from '../../../../../logger';
import type { AuthPayload } from '../../../../../rest/middlewares/auth';
import type { CreateTicketInput, UpdateTicketInput } from '../../../../../types/dto';

interface TicketQueryArgs {
  status?: string;
  priority?: string;
  assignedTeam?: string;
  page?: number;
  limit?: number;
}

export async function proxyCreateTicket(data: CreateTicketInput, user: AuthPayload) {
  const response = await axios.post(
    `${config.coreServerUrl}/v1/tickets`,
    { ...data, createdByAgentId: user.userId },
    { timeout: 10000 },
  );
  return response.data;
}

export async function proxyGetTickets(query: TicketQueryArgs) {
  const response = await axios.get(`${config.coreServerUrl}/v1/tickets`, {
    params: query,
    timeout: 10000,
  });
  return response.data;
}

export async function proxyGetTicket(id: string) {
  const response = await axios.get(`${config.coreServerUrl}/v1/tickets/${id}`, {
    timeout: 10000,
  });
  return response.data;
}

export async function proxyUpdateTicket(id: string, data: UpdateTicketInput, user: AuthPayload) {
  const response = await axios.patch(
    `${config.coreServerUrl}/v1/tickets/${id}`,
    { ...data, updatedByAgentId: user.userId },
    { timeout: 10000 },
  );
  return response.data;
}
