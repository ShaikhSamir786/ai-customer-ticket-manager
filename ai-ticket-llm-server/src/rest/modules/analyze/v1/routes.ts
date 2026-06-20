import { Router } from 'express';
import { analyzeController, analyzeWithProviderController } from './controllers';

const router = Router();
router.post('/', analyzeController);
router.post('/:provider', analyzeWithProviderController);

export { router as analyzeRoutes };
