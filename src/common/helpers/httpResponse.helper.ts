import { Request } from 'express'
import { StandardResponse } from '../interfaces/httpResponse.interface'
import { SUCCESS } from '../constants/res-codes/system.errors'

export class ResponseHelper {
  static async success<T>(
    data: T,
    req?: Request,
  ): Promise<StandardResponse<T>> {
    return {
      code: SUCCESS.code,
      message: SUCCESS.message,
      data,
      traceId: req && (req as any).traceId,
      timestamp: Date.now(),
      path: req?.originalUrl,
    }
  }

  static async error(
    code: string,
    req?: Request,
    data: any = null,
    params?: Record<string, string>,
  ): Promise<StandardResponse<any>> {
    return {
      code,
      message: 'error',
      data,
      traceId: req && (req as any).traceId,
      timestamp: Date.now(),
      path: req?.originalUrl,
    }
  }
}
