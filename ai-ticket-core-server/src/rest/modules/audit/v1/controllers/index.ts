import { Request, Response, NextFunction } from 'express';
import { getAuditLogs } from '../services';

export async function getAuditLogsController(req: Request, res: Response, next: NextFunction) {
  try { res.json(await getAuditLogs(req.query)); } catch (err) { next(err); }
}

