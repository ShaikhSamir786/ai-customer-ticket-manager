import { loadConfig } from '@ai-ticket/shared-lib';

const config = loadConfig();

export default {
  ...config,
  port: parseInt(process.env.CORE_SERVER_PORT || '3001', 10),
  serviceName: process.env.SERVICE_NAME || 'core-server',
};
