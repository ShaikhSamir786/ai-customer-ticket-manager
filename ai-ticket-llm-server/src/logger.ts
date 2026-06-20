import { createLogger } from '@ai-ticket/shared-lib';
import config from './config';

export const logger = createLogger({ service: config.serviceName, level: config.logLevel });
