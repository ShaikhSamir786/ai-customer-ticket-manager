import { Request, Response, NextFunction } from 'express';
import { AppError } from '@ai-ticket/shared-lib';
import { logger } from '../../logger';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    (res as any).status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  (res as any).status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}
