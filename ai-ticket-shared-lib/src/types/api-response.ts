/**
 * Standard API response envelope. Services return this shape from REST handlers
 * so frontend clients have a predictable contract.
 */
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly meta?: {
    readonly page?: number;
    readonly limit?: number;
    readonly total?: number;
    readonly correlationId?: string;
  };
}

export function okResponse<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> {
  return meta ? { success: true, data, meta } : { success: true, data };
}

export function errorResponse(params: {
  code: string;
  message: string;
  details?: unknown;
  correlationId?: string;
}): ApiResponse<never> {
  return {
    success: false,
    error: {
      code: params.code,
      message: params.message,
      ...(params.details !== undefined ? { details: params.details } : {}),
    },
    ...(params.correlationId
      ? { meta: { correlationId: params.correlationId } }
      : {}),
  };
}
