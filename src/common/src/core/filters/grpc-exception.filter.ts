// File: src/common/core/filters/grpc-exception.filter.ts

import { Catch, ExceptionFilter } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { Observable, throwError } from 'rxjs'
import { RpcMappableException } from '../exceptions/exception.interface'
import { AppLogger } from '../../logging/app-logger.service'
import { LogMeta } from '../../logging/oes-logger.interface'



@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown): Observable<never> {
    // 🔑 关键：如果是下游返回的 RpcException，直接透传！
    if (exception instanceof RpcException) {
      // 可选：记录日志（但不修改内容）
      const error = exception.getError()
      const details = this.safeGetDetailsFromError(error)
      const logmeta: LogMeta = {}
      if (details) {
        logmeta.errorCode = details.code
      }
      this.logger.warn('Propagating downstream RpcException')
      return throwError(() => exception) // ← 直接 re-throw
    }

    // 2. 本服务的已知业务异常
    if (
      exception instanceof Error &&
      typeof (exception as unknown as RpcMappableException).toRpcStatus === 'function'
    ) {
      const mappable = exception as unknown as RpcMappableException
      const rpcStatus = mappable.toRpcStatus()
      const details = typeof rpcStatus.details === 'object' ? rpcStatus.details : undefined
      this.logger.warn('Handled local business exception', {
        errorCode: details?.code,
        module: details?.service,
        details: details
      })
      return throwError(() => new RpcException(rpcStatus))
    }

    // 3. 本服务的未知系统异常
    const stack = (exception as Error)?.stack
    this.logger.error('Unhandled system exception', {
      details: { stack }
    })
    return throwError(
      () =>
        new RpcException({
          code: 13, // INTERNAL
          message: 'Internal server error',
          details: {
            code: 'COMMON_SYSTEM_001',
            service: process.env.SERVICE_NAME || 'unknown-service'
          }
        })
    )
  }
  private safeGetDetailsFromError(error: unknown): Record<string, string> | undefined {
    if (!error || typeof error !== 'object') {
      return undefined
    }

    const errObj = error as Record<string, string>

    // 如果 error 本身就是 details（某些自定义场景），也可兼容
    if (errObj.code && errObj.service) {
      return errObj
    }

    // 标准情况：error = { code, message, details: { ... } }
    const details = errObj.details
    if (!details) return undefined

    if (typeof details === 'string') {
      try {
        return JSON.parse(details)
      } catch {
        return { raw: details }
      }
    }

    if (typeof details === 'object' && details !== null) {
      return details as Record<string, string>
    }

    return undefined
  }
}
