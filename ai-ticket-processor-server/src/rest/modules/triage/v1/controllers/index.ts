import { Request, Response } from 'express';
import { catchAsync } from '@ai-ticket/shared-lib';
import { processTicket, processBatch } from '../services';

export const processTicketController = catchAsync(async (req: Request, res: Response) => {
  (res as any).json(await processTicket((req as any).body.ticketId));
});

export const processBatchController = catchAsync(async (req: Request, res: Response) => {
  (res as any).json(await processBatch((req as any).body.ticketIds));
});

