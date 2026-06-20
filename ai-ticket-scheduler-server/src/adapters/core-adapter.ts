import axios from 'axios';
import config from '../config/config';
import { logger } from '../logger';

export async function callCoreService(ticketId: string, action: string, data?: Record<string, unknown>, correlationId?: string) {
  try {
    logger.info('Calling core service', { ticketId, action, correlationId });
    const response = await axios.post(
      `${config.coreServerUrl}/v1/tickets/${ticketId}/${action}`,
      data,
      { headers: correlationId ? { 'X-Correlation-Id': correlationId } : undefined },
    );
    return response.data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to call core service', { ticketId, action, correlationId, error: message });
    throw err;
  }
}
