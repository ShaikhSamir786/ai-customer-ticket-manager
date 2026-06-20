import { Request, Response, NextFunction } from 'express';
import { getTeams, getTeam, createTeam, updateTeam } from '../services';

export async function getTeamsController(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await getTeams()); } catch (err) { next(err); }
}

export async function getTeamController(req: Request, res: Response, next: NextFunction) {
  try { res.json(await getTeam(req.params.id)); } catch (err) { next(err); }
}

export async function createTeamController(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await createTeam(req.body)); } catch (err) { next(err); }
}

export async function updateTeamController(req: Request, res: Response, next: NextFunction) {
  try { res.json(await updateTeam(req.params.id, req.body)); } catch (err) { next(err); }
}

