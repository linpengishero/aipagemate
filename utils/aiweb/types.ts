/**
 * 通用成功结果。
 */
export interface SuccessResult<T> {
  ok: true;
  data: T;
}

/**
 * 通用失败结果。
 */
export interface ErrorResult {
  ok: false;
  error: string;
  code?: string;
}

/**
 * 统一结果类型。
 */
export type Result<T> = SuccessResult<T> | ErrorResult;

/**
 * 构建成功结果。
 */
export const ok = <T>(data: T): SuccessResult<T> => ({
  ok: true,
  data,
});

/**
 * 构建失败结果。
 */
export const err = (error: string, code?: string): ErrorResult => ({
  ok: false,
  error,
  code,
});
