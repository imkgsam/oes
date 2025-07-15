// src/common/filters/all-rpc-exceptions.filter.ts

import { Catch, RpcExceptionFilter, ArgumentsHost } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { BusinessException } from '../exceptions/business.exception'
import { SystemException } from '../exceptions/system.exception'
import { throwError } from 'rxjs'
import { GLOBAL_SYSTEM_ERRORS } from '../constants/res-codes/system.errors'

@Catch()
export class AllRpcExceptionsFilter implements RpcExceptionFilter<any> {
  constructor(private readonly moduleName: string) { }

  catch(exception: unknown, host: ArgumentsHost) {

    console.log(`[${this.moduleName}]`, 'Caught exception:', exception)
    if (exception instanceof RpcException) {
      console.log(`[${this.moduleName}]`, 'Caught RpcException:', exception.getError())
      return throwError(() => exception)
    }
    if (exception instanceof BusinessException) {
      console.log(`[${this.moduleName}]`, 'Caught BusinessException:', exception)
      // 业务异常，转 RpcException
      return throwError(
        () =>
          new RpcException({
            code: exception.code,
            message: exception.message,
            messageKey: exception.messageKey,
            httpStatus: exception.httpStatus,
          }),
      )
    } else if (exception instanceof SystemException) {
      console.log(`[${this.moduleName}]`, 'Caught SystemException:', exception)
      // 系统异常，转 RpcException
      return throwError(
        () =>
          new RpcException({
            code: exception.code,
            message: exception.message,
            messageKey: exception.messageKey,
            httpStatus: exception.httpStatus,
            details: exception.details,
          }),
      )
    }
    console.log(`[${this.moduleName}]`, 'Caught unknown exception:', exception)
    // 兜底系统异常
    return throwError(
      () =>
        new RpcException({
          code: GLOBAL_SYSTEM_ERRORS.UNKNOWN_ERROR.code,
          message: GLOBAL_SYSTEM_ERRORS.UNKNOWN_ERROR.message,
          messageKey: GLOBAL_SYSTEM_ERRORS.UNKNOWN_ERROR.messageKey,
          httpStatus: GLOBAL_SYSTEM_ERRORS.UNKNOWN_ERROR.httpStatus,
          details:
            exception instanceof Error ? exception.message : String(exception),
        }),
    )
  }
}
