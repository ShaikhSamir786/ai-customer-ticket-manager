/**
 * Wrap an async Express route handler so rejected promises are forwarded to
 * `next(err)` instead of crashing the process or being silently swallowed.
 *
 * Eliminates the repetitive `try { ... } catch (err) { next(err); }` boilerplate
 * in every controller.
 *
 * Uses plain `Function` types to stay compatible across Express 4.x and 5.x
 * type definitions (each repo may pin a different major version).
 *
 * @example
 *   router.get('/', catchAsync(async (req, res) => { ... }));
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function catchAsync(fn: any): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
