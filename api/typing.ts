export interface ResponseBody<T = any> {
  msg?: string
  code?: number
  data?: T
}

/** 统一返回结构体 */

export interface PageResult<T = any> {
  data: {
    list: T[]
    total: number
  }
  msg?: string
}

export interface ListResult<T = any> {
  list: T[]
  total: number
}
