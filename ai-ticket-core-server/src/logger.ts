import { createLogger, type Logger } from '@ai-ticket/shared-lib';
import config from './config';

export const logger: Logger = createLogger({ service: config.serviceName, level: config.logLevel });
