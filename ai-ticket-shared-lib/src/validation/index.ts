import { z } from 'zod';

/**
 * Shared, reusable zod schemas for common request input patterns. Services
 * extend these with their own domain-specific schemas.
 */

/** A RFC-4122 UUID string. */
export const uuidSchema = z.string().uuid();

/** A trimmed, non-empty email string. */
export const emailSchema = z.string().email().trim().toLowerCase();

/**
 * Pagination query params with defensive bounds. `page`/`limit` are coerced
 * from string (typical query-string input) and capped so a malicious or naive
 * `limit=10000000` cannot trigger OOM in the DB layer.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(50),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/** A non-empty string with a maximum length — the most common field shape. */
export const boundedString = (max: number, min = 1) =>
  z.string().trim().min(min).max(max);
