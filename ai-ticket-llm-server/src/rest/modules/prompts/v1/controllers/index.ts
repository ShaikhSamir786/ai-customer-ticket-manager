import { Request, Response, NextFunction } from 'express';
import { getPrompts, createPrompt } from '../services';

export async function getPromptsController(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await getPrompts()); } catch (err) { next(err); }
}

export async function createPromptController(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await createPrompt(req.body)); } catch (err) { next(err); }
}

