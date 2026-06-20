import { GraphQLError } from 'graphql';
import { AppError, UnauthorizedError } from '@ai-ticket/shared-lib';
import type { GraphQLContext } from '../context';

export function requireAuth(context: GraphQLContext) {
  if (!context.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return context.user;
}

export function formatAppError(err: unknown): never {
  if (err instanceof AppError) {
    throw new GraphQLError(err.message, {
      extensions: { code: err.code, statusCode: err.statusCode, details: err.details },
    });
  }
  throw err;
}
