import IORedis, { type RedisOptions } from 'ioredis';
import config from '../config/config';
import { logger } from '../logger';

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: config.redisMaxRetriesPerRequest,
  connectTimeout: config.redisConnectTimeout,
  keepAlive: config.redisKeepAlive,
  enableReadyCheck: config.redisEnableReadyCheck,
  port: config.redisPort,
  retryStrategy: (times: number) => {
    if (times > config.redisMaxRetryAttempts) {
      logger.error('Redis max retry attempts exceeded', { attempts: times });
      return null;
    }
    const delay = Math.min(config.redisRetryDelay * Math.pow(2, times - 1), 30000);
    logger.warn('Redis connection retry', { attempt: times, nextDelayMs: delay });
    return delay;
  },
};

if (config.redisTlsEnabled) {
  redisOptions.tls = {};
}

const connection = new IORedis(config.redisUrl, redisOptions);

connection.on('error', (err) => {
  logger.error('Redis connection error', { error: err.message });
});

connection.on('connect', () => {
  logger.info('Successfully connected to Redis');
});

export default connection;
