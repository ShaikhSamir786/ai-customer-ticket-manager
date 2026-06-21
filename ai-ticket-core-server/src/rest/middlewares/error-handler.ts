import { Request, Response, NextFunction } from 'express';
import { AppError } from '@ai-ticket/shared-lib';
import { logger } from '../../logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const correlationId = (req as any).correlationId;

  if (err instanceof AppError) {
    logger.warn('AppError handled', {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      correlationId,
    });
    (res as any).status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack, correlationId });

  (res as any).status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
