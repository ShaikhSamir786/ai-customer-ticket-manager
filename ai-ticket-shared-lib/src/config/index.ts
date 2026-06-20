import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface AppConfig {
  port: number;
  nodeEnv: string;
  serviceName: string;
  logLevel: string;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  queueType: 'bullmq' | 'kafka';
  corsOrigins: string[];
  llm: {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    ollamaEndpoint?: string;
    defaultModel: string;
    fallbackModel: string;
  };
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    serviceName: process.env.SERVICE_NAME || 'unknown',
    logLevel: process.env.LOG_LEVEL || 'info',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_ticket',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    queueType: (process.env.QUEUE_TYPE as 'bullmq' | 'kafka') || 'bullmq',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    llm: {
      openaiApiKey: process.env.OPENAI_API_KEY,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      ollamaEndpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
      defaultModel: process.env.LLM_DEFAULT_MODEL || 'gpt-4-turbo',
      fallbackModel: process.env.LLM_FALLBACK_MODEL || 'gpt-3.5-turbo',
    },
  };
}
