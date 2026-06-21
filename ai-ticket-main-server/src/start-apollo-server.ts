import { Express } from 'express';
import express from 'express';
import http from 'http';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express4';
import cors from 'cors';
import config from './config';
import { logger } from './logger';
import { typeDefs, resolvers, createContext } from './modules';

export async function startApolloServer(app: Express, httpServer: http.Server) {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (formattedError) => {
      const extensions = formattedError.extensions;
      if (extensions?.statusCode) {
        return {
          message: formattedError.message,
          extensions: {
            code: extensions.code || 'INTERNAL_ERROR',
            statusCode: extensions.statusCode,
            ...(extensions.details ? { details: extensions.details } : {}),
          },
        };
      }
      return formattedError;
    },
    introspection: config.nodeEnv !== 'production',
  });

  await server.start();

  (app as any).use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }: { req: any }) => await createContext({ req }),
    }),
  );
}
