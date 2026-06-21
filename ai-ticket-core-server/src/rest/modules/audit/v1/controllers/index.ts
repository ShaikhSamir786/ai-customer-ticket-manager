import { Request, Response } from 'express';
import { catchAsync } from '@ai-ticket/shared-lib';
import { getAuditLogs } from '../services';

export const getAuditLogsController = catchAsync(async (req: Request, res: Response) => {
  (res as any).json(await getAuditLogs((req as any).query as Record<string, string>));
});
