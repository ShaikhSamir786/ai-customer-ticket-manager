import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { requestIdMiddleware } from '@ai-ticket/shared-lib';
import config from './config';
import { logger } from './logger';
import { startApolloServer } from './start-apollo-server';
import { errorHandler } from './rest/middlewares/error-handler';

const app = express();
const httpServer = http.createServer(app);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", 'data:', 'apollo-server-landing-page.cdn.apollographql.com'],
        scriptSrc: ["'self'", "https: 'unsafe-inline'", 'embeddable-sandbox.cdn.apollographql.com'],
        manifestSrc: ["'self'", 'apollo-server-landing-page.cdn.apollographql.com'],
        frameSrc: ["'self'", 'sandbox.embed.apollographql.com'],
      },
    },
  })
);
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());
app.use(requestIdMiddleware());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
});
app.use(limiter);

app.get('/health', (_req: any, res: any) => {
  res.json({ status: 'ok', service: config.serviceName, timestamp: new Date().toISOString() });
});

async function start() {
  await startApolloServer(app, httpServer);

  httpServer.listen(config.port, () => {
    logger.info(`Main server (gateway) listening on port ${config.port}`);
    logger.info(`GraphQL endpoint: http://localhost:${config.port}/graphql`);
  });
}

start();

app.use(errorHandler);

export default app;
