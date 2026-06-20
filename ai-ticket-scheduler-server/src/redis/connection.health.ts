import connection from './connection';
import { logger } from '../logger';

export async function checkRedisHealth(): Promise<boolean> {
  try {
    await connection.ping();
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Redis health check failed', { error: message });
    return false;
  }
}
