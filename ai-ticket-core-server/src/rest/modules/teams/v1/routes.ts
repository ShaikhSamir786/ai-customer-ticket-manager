import { Router } from 'express';
import { getTeamsController, getTeamController, createTeamController, updateTeamController } from './controllers';

const router = Router();
router.get('/', getTeamsController);
router.get('/:id', getTeamController);
router.post('/', createTeamController);
router.patch('/:id', updateTeamController);

export { router as teamRoutes };
