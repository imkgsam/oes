// File: src/common/src/core/filters/grpc-exception.filter.ts

import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'
import { AppLogger } from '../../logging/app-logger.service'
import { Observable, throwError } from 'rxjs'
import { OESExceptionBase } from '../exceptions/oes.exception'
import { RpcException } from '@nestjs/microservices'
import { ExceptionPayload } from '../exceptions/exception.interface'
import { ExceptionFactory, UNKNOWN_EXCEPTION } from '../exceptions'

@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): Observable<never> {
    const rpcCtx = host.switchToRpc()
    const call = host.getArgByIndex(2)
    const methodName = this.getMethodName(call)
    const module = process.env.MODULE_NAME || 'unknown-service'

    if (exception instanceof RpcException) {
      // 处理下游返回的 rpc exception (不包括 下游服务的timeout unavailable, 等情况)
      const payload = exception.getError() as ExceptionPayload
      this.logger.warn('Downstream rpc exception', {
        module,
        operation: methodName,
        errorCode: this.getErrorCode(payload.details),
        details: payload.details
      })
      return throwError(() => exception)
    } else if (exception instanceof OESExceptionBase) {
      // 处理本服务抛出的三类异常, 同时包含了 adaptor以及client返回的针对对下游请求的timeout,unavailable, 等情况的包装成本服务的infra异常
      const payload = exception.toRpcPayload()
      this.logger.warn('Local business exception', {
        module,
        operation: methodName,
        errorCode: this.getErrorCode(payload.details),
        details: payload.details
      })
      return throwError(() => payload)
    } else {
      // 处理未知异常
      const unknownExp = ExceptionFactory.infrastructure(UNKNOWN_EXCEPTION, {
        stack: (exception as Error)?.stack,
        message: (exception as Error)?.message
      })
      const payload = unknownExp.toRpcPayload()
      this.logger.error('Unhandled unknown exception', {
        module,
        operation: methodName,
        errorCode: this.getErrorCode(payload.details),
        details: payload.details
      })
      return throwError(() => payload)
    }
  }

  // private parseRpcError(error: unknown): RpcExceptionPayload {
  //   if (!error) return { code: status.UNKNOWN, message: 'Unknown error' }
  //   if (typeof error === 'string')
  //     return { code: status.UNKNOWN, message: error, details: { internalDetails: { raw: error } } }
  //   if (typeof error === 'object') {
  //     const errObj = error as any
  //     const details =
  //       errObj.details && typeof errObj.details === 'object'
  //         ? errObj.details
  //         : { raw: errObj.details }
  //     return {
  //       code: errObj.code ?? status.UNKNOWN,
  //       message: errObj.message ?? 'Unknown error',
  //       details
  //     }
  //   }
  //   return {
  //     code: status.UNKNOWN,
  //     message: 'Unknown error',
  //     details: { internalDetails: { raw: error } }
  //   }
  // }

  private getErrorCode(details?: any): string | undefined {
    return details && typeof details === 'object' ? details.code : undefined
  }

  private getMethodName(call: any): string {
    const candidates = [
      call?.call?.handler?.path,
      call?.handler?.path,
      call?.call?.path,
      call?.path,
      call?.call?.method,
      call?.method
    ]

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate
      }
    }

    return 'unknown-method'
  }
}
