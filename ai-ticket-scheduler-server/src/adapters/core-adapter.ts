import axios from 'axios';
import config from '../config/config';
import { logger } from '../logger';

const VALID_ACTIONS = ['update-status', 'assign', 'add-note', 'resolve', 'close'] as const;
type Action = typeof VALID_ACTIONS[number];

function isValidAction(action: string): action is Action {
  return (VALID_ACTIONS as readonly string[]).includes(action);
}

export async function callCoreService(ticketId: string, action: string, data?: Record<string, unknown>, correlationId?: string) {
  if (!isValidAction(action)) {
    throw new Error(`Invalid core service action: ${action}. Valid: ${VALID_ACTIONS.join(', ')}`);
  }

  try {
    logger.info('Calling core service', { ticketId, action, correlationId });
    const response = await axios.post(
      `${config.coreServerUrl}/v1/tickets/${ticketId}/${action}`,
      data,
      {
        timeout: 25000,
        headers: {
          ...(correlationId ? { 'X-Correlation-Id': correlationId } : {}),
          ...(config.internalApiKey ? { 'X-Api-Key': config.internalApiKey } : {}),
        },
      },
    );
    return response.data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to call core service', { ticketId, action, correlationId, error: message });
    throw err;
  }
}
