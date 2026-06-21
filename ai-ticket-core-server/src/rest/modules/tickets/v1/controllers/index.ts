import { Request, Response } from 'express';
import { catchAsync } from '@ai-ticket/shared-lib';
import { createTicket, getTicket, getTickets, updateTicket, updateTicketTriage } from '../services';

export const createTicketController = catchAsync(async (req: Request, res: Response) => {
  const ticket = await createTicket((req as any).body);
  (res as any).status(201).json(ticket);
});

export const getTicketsController = catchAsync(async (req: Request, res: Response) => {
  const result = await getTickets((req as any).query as Record<string, string>);
  (res as any).json(result);
});

export const getTicketController = catchAsync(async (req: Request, res: Response) => {
  const ticket = await getTicket((req as any).params.id);
  (res as any).json(ticket);
});

export const updateTicketController = catchAsync(async (req: Request, res: Response) => {
  const ticket = await updateTicket((req as any).params.id, (req as any).body);
  (res as any).json(ticket);
});

export const updateTicketTriageController = catchAsync(async (req: Request, res: Response) => {
  const ticket = await updateTicketTriage((req as any).body);
  (res as any).json(ticket);
});
