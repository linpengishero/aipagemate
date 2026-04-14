import { ERROR_CODES, type ErrorCode } from './errorCodes';

export interface ApiSuccess<T> {
  ok: true;
  code: 'SUCCESS';
  message: string;
  data: T;
  traceId: string;
}

export interface ApiFailure {
  ok: false;
  code: ErrorCode;
  message: string;
  data: null;
  traceId: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export const createTraceId = (prefix = 'aiweb') => {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
};

export const toSuccess = <T>(
  data: T,
  options?: { message?: string; traceId?: string },
): ApiSuccess<T> => ({
  ok: true,
  code: 'SUCCESS',
  message: options?.message || 'ok',
  data,
  traceId: options?.traceId || createTraceId(),
});

export const toFailure = (
  code: ErrorCode = ERROR_CODES.UNKNOWN_ERROR,
  message = 'Request failed',
  options?: { traceId?: string },
): ApiFailure => ({
  ok: false,
  code,
  message,
  data: null,
  traceId: options?.traceId || createTraceId(),
});
