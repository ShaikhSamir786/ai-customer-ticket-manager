import { ERROR_CODES } from '../constant/service-constant';

/**
 * Shared error metadata captured by every AppError so it serializes cleanly
 * across service boundaries and HTTP responses.
 */
export interface AppErrorJson {
  name: string;
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  correlationId?: string;
}

/**
 * Base application error.
 *
 * Uses `Object.setPrototypeOf` so `instanceof AppError` (and `instanceof`
 * any subclass) works correctly even when the class hierarchy is transpiled
 * down to older targets — the classic TypeScript prototype-chain bug.
 */
export class AppError extends Error {
  public correlationId?: string;

  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    // Restore the prototype chain — required for correct `instanceof` checks.
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /** Attach a correlation ID for distributed tracing across services. */
  withCorrelationId(correlationId: string): this {
    this.correlationId = correlationId;
    return this;
  }

  /** Serialize to a plain object suitable for JSON responses/logs. */
  toJSON(): AppErrorJson {
    const json: AppErrorJson = {
      name: this.name,
      statusCode: this.statusCode,
      code: this.code,
      message: this.message,
    };
    if (this.details !== undefined) json.details = this.details;
    if (this.correlationId !== undefined) json.correlationId = this.correlationId;
    return json;
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super(404, ERROR_CODES.NOT_FOUND, `${entity} with id ${id} not found`);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, ERROR_CODES.VALIDATION_ERROR, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, ERROR_CODES.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, ERROR_CODES.FORBIDDEN, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, ERROR_CODES.CONFLICT, message);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super(
      429,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      'Too many requests, please try again later',
    );
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(502, ERROR_CODES.EXTERNAL_SERVICE_ERROR, `${service}: ${message}`);
  }
}
