import { Request } from 'express'
import { StandardResponse } from '../interfaces/httpResponse.interface'
import { SUCCESS } from '../constants/res-codes/system.errors'

/**
 * 响应帮助类, 这个目前没有使用
 * 
 * 目前没有使用. 而是在apigateway中使用ResponseTransformInterceptor 拦截器来处理统一返回response结构
 */ 
export class ResponseHelper {
  static success<T>(
    data: T,
    req?: Request,
  ): StandardResponse<T> {
    return {
      code: SUCCESS.subCode,
      message: SUCCESS.message,
      data,
      traceId: req?.['traceId'],
      timestamp: new Date().toISOString(),
      path: req?.originalUrl,
    }
  }

  static error(
    code: string,
    message?: string,
    req?: Request,
    data: any = null,
  ): StandardResponse<any> {
    return {
      code,
      message: message ?? 'error',
      data,
      traceId: req?.['traceId'],
      timestamp: new Date().toISOString(),
      path: req?.originalUrl,
    }
  }
}
