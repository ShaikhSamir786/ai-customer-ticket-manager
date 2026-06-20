import jwt from 'jsonwebtoken';
import config from './config';
import { UnauthorizedError } from '@ai-ticket/shared-lib';
import type { AuthPayload } from './rest/middlewares/auth';

export interface GraphQLContext {
  user?: AuthPayload;
}

export async function createContext({ req }: { req: { headers: { authorization?: string } } }): Promise<GraphQLContext> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return {};
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    return { user: payload };
  } catch {
    return {};
  }
}
