import { loadConfig } from '@ai-ticket/shared-lib';

const config = loadConfig();

export default {
  ...config,
  port: parseInt(process.env.MAIN_SERVER_PORT || '4000', 10),
  serviceName: 'main-server',
  coreServerUrl: process.env.CORE_SERVER_URL || 'http://localhost:3001',
  processorServerUrl: process.env.PROCESSOR_SERVER_URL || 'http://localhost:3002',
  llmServerUrl: process.env.LLM_SERVER_URL || 'http://localhost:3003',
};
