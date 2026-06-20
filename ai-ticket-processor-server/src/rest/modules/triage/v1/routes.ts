import { Router } from 'express';
import { processTicketController, processBatchController } from './controllers';

const router = Router();
router.post('/process', processTicketController);
router.post('/batch', processBatchController);

export { router as triageRoutes };
