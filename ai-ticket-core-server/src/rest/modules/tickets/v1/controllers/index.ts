import { Request, Response, NextFunction } from 'express';
import { createTicket, getTicket, getTickets, updateTicket, updateTicketTriage } from '../services';

export async function createTicketController(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await createTicket(req.body);
    res.status(201).json(ticket);
  } catch (err) { next(err); }
}

export async function getTicketsController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getTickets(req.query);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getTicketController(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await getTicket(req.params.id);
    res.json(ticket);
  } catch (err) { next(err); }
}

export async function updateTicketController(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await updateTicket(req.params.id, req.body);
    res.json(ticket);
  } catch (err) { next(err); }
}

export async function updateTicketTriageController(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await updateTicketTriage(req.body);
    res.json(ticket);
  } catch (err) { next(err); }
}

