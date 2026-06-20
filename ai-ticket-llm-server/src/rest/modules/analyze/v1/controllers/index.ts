import { Request, Response, NextFunction } from 'express';
import { analyze, analyzeWithProvider } from '../services';

export async function analyzeController(req: Request, res: Response, next: NextFunction) {
  try { res.json(await analyze(req.body)); } catch (err) { next(err); }
}

export async function analyzeWithProviderController(req: Request, res: Response, next: NextFunction) {
  try { res.json(await analyzeWithProvider(req.params.provider as any, req.body)); } catch (err) { next(err); }
}

