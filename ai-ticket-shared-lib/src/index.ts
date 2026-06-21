import { createLogger, Logger, withCorrelationId, newCorrelationId } from './logger';
import { loadConfig, resetConfigCache, AppConfig, DEV_JWT_SECRET } from './config';
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
} from './errors';
import type { AppErrorJson } from './errors';
import {
  QUEUE_NAMES,
  JOB_NAMES,
  EVENTS,
} from './queue';
import {
  LOG_LEVELS,
  NODE_ENVS,
  ERROR_CODES,
} from './constant/service-constant';
import { catchAsync } from './middleware/async-wrap';
import { requestIdMiddleware } from './middleware/request-id';
import {
  uuidSchema,
  emailSchema,
  paginationSchema,
  boundedString,
} from './validation';
import type { PaginationInput } from './validation';
import type { ApiResponse } from './types/api-response';
import { okResponse, errorResponse } from './types/api-response';

export {
  createLogger,
  withCorrelationId,
  newCorrelationId,
  loadConfig,
  resetConfigCache,
  DEV_JWT_SECRET,
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  QUEUE_NAMES,
  JOB_NAMES,
  EVENTS,
  LOG_LEVELS,
  NODE_ENVS,
  ERROR_CODES,
  catchAsync,
  requestIdMiddleware,
  uuidSchema,
  emailSchema,
  paginationSchema,
  boundedString,
  okResponse,
  errorResponse,
};

export type {
  Logger,
  AppConfig,
  AppErrorJson,
  PaginationInput,
  ApiResponse,
};
