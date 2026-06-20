import winston from 'winston';

interface LoggerOptions {
  service: string;
  level?: string;
}

export function createLogger(options: LoggerOptions) {
  const { service, level = process.env.LOG_LEVEL || 'info' } = options;

  return winston.createLogger({
    level,
    defaultMeta: { service },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
          })
        )
      })
    ]
  });
}

export type Logger = winston.Logger;
