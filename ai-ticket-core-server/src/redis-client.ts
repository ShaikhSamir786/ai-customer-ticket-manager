import IORedis from 'ioredis';
import config from './config';
import { logger } from './logger';

const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
  connectTimeout: 10000,
  retryStrategy: (times: number) => {
    if (times > 10) {
      logger.error('Redis max retry attempts exceeded', { attempts: times });
      return null;
    }
    return Math.min(times * 200, 5000);
  },
});

connection.on('error', (err) => {
  logger.error('Redis connection error', { error: err.message });
});

connection.on('connect', () => {
  logger.info('Connected to Redis');
});

export default connection;
