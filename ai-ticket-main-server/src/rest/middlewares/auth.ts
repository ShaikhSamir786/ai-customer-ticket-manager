import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config';
import { UnauthorizedError } from '@ai-ticket/shared-lib';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  teamId?: string;
}

export function isAuthenticated(req: Request, _res: Response, next: any): void {
  const authHeader = (req as any).headers?.authorization as string | undefined;
  if (!authHeader?.startsWith('Bearer ')) {
    return void next(new UnauthorizedError('Missing or invalid authorization header'));
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    (req as any).user = payload;
    next();
  } catch {
    return void next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: any): void => {
    const user = (req as any).user as AuthPayload | undefined;
    if (!user || !roles.includes(user.role)) {
      return void next(new UnauthorizedError('Insufficient permissions'));
    }
    next();
  };
}
