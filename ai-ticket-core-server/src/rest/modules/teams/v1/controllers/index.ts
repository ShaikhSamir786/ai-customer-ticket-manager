import { Request, Response } from 'express';
import { catchAsync } from '@ai-ticket/shared-lib';
import { getTeams, getTeam, createTeam, updateTeam } from '../services';

export const getTeamsController = catchAsync(async (_req: Request, res: Response) => {
  (res as any).json(await getTeams());
});

export const getTeamController = catchAsync(async (req: Request, res: Response) => {
  (res as any).json(await getTeam((req as any).params.id));
});

export const createTeamController = catchAsync(async (req: Request, res: Response) => {
  (res as any).status(201).json(await createTeam((req as any).body));
});

export const updateTeamController = catchAsync(async (req: Request, res: Response) => {
  (res as any).json(await updateTeam((req as any).params.id, (req as any).body));
});
