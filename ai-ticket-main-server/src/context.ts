import jwt from 'jsonwebtoken';
import config from './config';
import type { AuthPayload } from './rest/middlewares/auth';

export interface GraphQLContext {
  user?: AuthPayload;
}

export async function createContext({ req }: { req: { headers?: Record<string, string | string[] | undefined> } }): Promise<GraphQLContext> {
  const authHeader = req.headers?.authorization as string | undefined;
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
