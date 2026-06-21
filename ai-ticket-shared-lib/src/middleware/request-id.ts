import { newCorrelationId } from '../logger';

/**
 * Request ID / correlation ID middleware.
 *
 * - Reads an incoming `x-request-id` header if present (so IDs propagate
 *   across the gateway → internal service boundary).
 * - Otherwise generates a new UUIDv4.
 * - Attaches the value to `req.correlationId` and echoes it back on the
 *   `x-request-id` response header so callers can correlate logs.
 *
 * Uses plain `any` for req/res to stay compatible across Express 4.x and 5.x
 * type definitions used in consuming repos.
 */
export function requestIdMiddleware() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (req: any, res: any, next: any) => {
    const incoming = req.header ? req.header('x-request-id') : (req.headers?.['x-request-id']);
    const correlationId =
      incoming && typeof incoming === 'string' && incoming.trim()
        ? incoming.trim()
        : newCorrelationId();

    req.correlationId = correlationId;
    if (res.setHeader) res.setHeader('x-request-id', correlationId);

    next();
  };
}
