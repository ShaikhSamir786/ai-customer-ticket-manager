import { Request, Response, NextFunction } from 'express';
import { processTicket, processBatch } from '../services';

export async function processTicketController(req: Request, res: Response, next: NextFunction) {
  try { res.json(await processTicket(req.body.ticketId)); } catch (err) { next(err); }
}

export async function processBatchController(req: Request, res: Response, next: NextFunction) {
  try { res.json(await processBatch(req.body.ticketIds)); } catch (err) { next(err); }
}

