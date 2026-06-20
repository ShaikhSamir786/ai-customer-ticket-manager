import axios from 'axios';
import config from '../config/config';
import { logger } from '../logger';

export async function callProcessorService(ticketId: string, correlationId?: string) {
  try {
    const response = await axios.post(
      `${config.processorServerUrl}/v1/triage/process`,
      { ticketId },
      { headers: correlationId ? { 'X-Correlation-Id': correlationId } : undefined },
    );
    logger.info('Processor service called successfully', { ticketId, correlationId });
    return response.data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to call processor service', { ticketId, correlationId, error: message });
    throw err;
  }
}
