import { Router } from 'express';
import { createTicketController, getTicketController, getTicketsController, updateTicketController, updateTicketTriageController } from './controllers';

const router = Router();

router.post('/', createTicketController);
router.get('/', getTicketsController);
router.get('/:id', getTicketController);
router.patch('/:id', updateTicketController);
router.post('/update-triage', updateTicketTriageController);

export { router as ticketRoutes };
