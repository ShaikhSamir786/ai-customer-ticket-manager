import { loadConfig } from '@ai-ticket/shared-lib';

const config = loadConfig();

export default {
  ...config,
  port: parseInt(process.env.LLM_SERVER_PORT || '3003', 10),
  serviceName: process.env.SERVICE_NAME || 'llm-server',
  defaultModel: process.env.LLM_DEFAULT_MODEL || 'gpt-4-turbo',
  fallbackModel: process.env.LLM_FALLBACK_MODEL || 'gpt-3.5-turbo',
};
