/**
 * Module augmentation adding optional correlation ID context to every Express
 * request. Populated by the `requestIdMiddleware` from this package.
 *
 * Declared here (in the shared lib) so any service that consumes the middleware
 * gets typed `req.correlationId` without re-declaring it.
 *
 * We augment `express-serve-static-core` directly (not `express`) since that is
 * the base module that both express 4.x and 5.x re-export. This keeps the
 * declaration compatible with either version pinned in consuming repos.
 */
declare namespace Express {
  interface Request {
    correlationId?: string;
  }
}
