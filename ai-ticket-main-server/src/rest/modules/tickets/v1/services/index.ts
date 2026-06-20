import axios from 'axios';
import config from '../../../../../config';
import { logger } from '../../../../../logger';
import type { AuthPayload } from '../../../../../rest/middlewares/auth';

export async function proxyCreateTicket(data: any, user: AuthPayload) {
  const response = await axios.post(`${config.coreServerUrl}/v1/tickets`, {
    ...data,
    createdByAgentId: user.userId,
  });
  return response.data;
}

export async function proxyGetTickets(query: any) {
  const response = await axios.get(`${config.coreServerUrl}/v1/tickets`, { params: query });
  return response.data;
}

export async function proxyGetTicket(id: string) {
  const response = await axios.get(`${config.coreServerUrl}/v1/tickets/${id}`);
  return response.data;
}

export async function proxyUpdateTicket(id: string, data: any, user: AuthPayload) {
  const response = await axios.patch(`${config.coreServerUrl}/v1/tickets/${id}`, {
    ...data,
    updatedByAgentId: user.userId,
  });
  return response.data;
}
