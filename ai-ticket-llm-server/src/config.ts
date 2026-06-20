import { loadConfig } from '@ai-ticket/shared-lib';

const config = loadConfig();

export default {
  ...config,
  port: parseInt(process.env.LLM_SERVER_PORT || '3003', 10),
  serviceName: 'llm-server',
};
