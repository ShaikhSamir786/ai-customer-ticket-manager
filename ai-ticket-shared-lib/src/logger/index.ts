import crypto from 'crypto';
import winston from 'winston';
import { NODE_ENVS } from '../constant/service-constant';

export interface LoggerOptions {
  service: string;
  level?: string;
}

/**
 * Build a winston logger for a service.
 *
 * - Production: JSON-only output (no colorize/printf) so logs parse cleanly in
 *   aggregators like ELK/Datadog.
 * - Development: colorized, human-readable single-line format with metadata.
 * - `exitOnError: false` so a logging transport failure never kills the process.
 */
export function createLogger(options: LoggerOptions) {
  const { service, level = process.env.LOG_LEVEL || 'info' } = options;
  const isProduction = process.env.NODE_ENV === NODE_ENVS.PRODUCTION;

  const baseFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
  );

  const consoleTransport = isProduction
    ? new winston.transports.Console({ format: winston.format.json() })
    : new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, service, ...meta }) => {
              const metaStr = Object.keys(meta).length
                ? ` ${JSON.stringify(meta)}`
                : '';
              return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
            },
          ),
        ),
      });

  const logger = winston.createLogger({
    level,
    defaultMeta: { service },
    format: baseFormat,
    exitOnError: false,
    transports: [consoleTransport],
  });

  return logger;
}

export type Logger = winston.Logger;

/**
 * Create a child logger pinned to a correlation ID. Convenience wrapper around
 * winston's `.child()` for the common distributed-tracing case.
 *
 * @example
 *   const log = withCorrelationId(baseLogger, crypto.randomUUID());
 */
export function withCorrelationId(logger: Logger, correlationId: string): Logger {
  return logger.child({ correlationId });
}

/**
 * Generate a new correlation ID. Centralized so all services share one format.
 */
export function newCorrelationId(): string {
  return crypto.randomUUID();
}
