import { Router } from 'express';
import { getAuditLogsController } from './controllers';

const router = Router();
router.get('/', getAuditLogsController);

export { router as auditRoutes };
