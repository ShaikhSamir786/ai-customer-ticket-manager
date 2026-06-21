import { Request, RequestHandler, Response } from 'express';
import { UnauthorizedError } from '@ai-ticket/shared-lib';

export function internalAuth(expectedKey?: string): RequestHandler {
  const apiKey = expectedKey || process.env.INTERNAL_API_KEY || 'dev-internal-key';
  return (req: Request, res: Response, next: any) => {
    const provided = (req as any).header('x-api-key') as string | undefined;
    if (!provided || provided !== apiKey) {
      return void next(new UnauthorizedError('Invalid or missing API key'));
    }
    next();
  };
}
