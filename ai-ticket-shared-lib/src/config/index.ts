import dotenv from 'dotenv';
import path from 'path';
import { LOG_LEVELS, NODE_ENVS } from '../constant/service-constant';

/**
 * Valid queue backend implementations. Validated at runtime against the
 * QUEUE_TYPE env var instead of using an unsafe cast.
 */
const VALID_QUEUE_TYPES = ['bullmq', 'kafka'] as const;
type QueueType = (typeof VALID_QUEUE_TYPES)[number];

/**
 * The insecure default secret used only outside production. Referenced here so
 * the production guard can detect when JWT_SECRET was left at its default.
 */
export const DEV_JWT_SECRET = 'dev-secret-change-in-production';

/**
 * Track whether `.env` has been loaded so the side-effect only happens once,
 * and only when `loadConfig()` is actually called (lazy — not at import time).
 */
let envLoaded = false;

/** Cached config singleton: env vars are not expected to change at runtime. */
let cachedConfig: AppConfig | null = null;

function parseQueueType(raw: string | undefined): QueueType {
  if (raw && (VALID_QUEUE_TYPES as readonly string[]).includes(raw)) {
    return raw as QueueType;
  }
  return 'bullmq';
}

/**
 * Load `.env` from the current working directory exactly once.
 * Extracted so it can be skipped in tests or called explicitly.
 */
function loadEnv(): void {
  if (envLoaded) return;
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  envLoaded = true;
}

export interface AppConfig {
  readonly port: number;
  readonly nodeEnv: string;
  readonly serviceName: string;
  readonly logLevel: string;
  readonly databaseUrl: string;
  readonly redisUrl: string;
  readonly jwtSecret: string;
  readonly jwtExpiresIn: string;
  readonly queueType: QueueType;
  readonly corsOrigins: string[];
  readonly llm: {
    readonly openaiApiKey?: string;
    readonly anthropicApiKey?: string;
    readonly ollamaEndpoint?: string;
    readonly defaultModel: string;
    readonly fallbackModel: string;
  };
}

/**
 * Build the application config from environment variables.
 *
 * - Loads `.env` lazily (no import-time side effect).
 * - Memoizes the result.
 * - Throws in production if `JWT_SECRET` is missing or still set to the
 *   insecure dev default.
 */
export function loadConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  loadEnv();

  const nodeEnv = process.env.NODE_ENV || NODE_ENVS.DEVELOPMENT;
  const jwtSecret = process.env.JWT_SECRET || DEV_JWT_SECRET;

  if (nodeEnv === NODE_ENVS.PRODUCTION && (!jwtSecret || jwtSecret === DEV_JWT_SECRET)) {
    throw new Error(
      'JWT_SECRET must be set to a strong value in production (the default dev secret is not allowed).',
    );
  }

  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  cachedConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv,
    serviceName: process.env.SERVICE_NAME || 'unknown',
    logLevel: process.env.LOG_LEVEL || LOG_LEVELS.INFO,
    databaseUrl:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/ai_ticket',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    queueType: parseQueueType(process.env.QUEUE_TYPE),
    corsOrigins,
    llm: {
      openaiApiKey: process.env.OPENAI_API_KEY,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      ollamaEndpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
      defaultModel: process.env.LLM_DEFAULT_MODEL || 'gpt-4-turbo',
      fallbackModel: process.env.LLM_FALLBACK_MODEL || 'gpt-3.5-turbo',
    },
  };

  return cachedConfig;
}

/**
 * Reset the memoized config. Intended for tests that mutate `process.env`.
 */
export function resetConfigCache(): void {
  cachedConfig = null;
  envLoaded = false;
}
