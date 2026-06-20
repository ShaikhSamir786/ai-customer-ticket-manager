import { Router } from 'express';
import { getPromptsController, createPromptController } from './controllers';

const router = Router();
router.get('/', getPromptsController);
router.post('/', createPromptController);

export { router as promptRoutes };
