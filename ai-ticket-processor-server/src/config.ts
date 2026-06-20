import { loadConfig } from '@ai-ticket/shared-lib';

const config = loadConfig();

export default {
  ...config,
  port: parseInt(process.env.PROCESSOR_SERVER_PORT || '3002', 10),
  serviceName: 'processor-server',
  coreServerUrl: process.env.CORE_SERVER_URL || 'http://localhost:3001',
  llmServerUrl: process.env.LLM_SERVER_URL || 'http://localhost:3003',
};
