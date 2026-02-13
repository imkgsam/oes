import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'
import { AppLogger } from '../../logging/app-logger.service'
import { Observable, throwError } from 'rxjs'
import { OESExceptionBase } from '../exceptions/oes.exception'
import { RpcException } from '@nestjs/microservices'
import { RpcExceptionPayload } from '../exceptions/exception.interface'
import { status } from '@grpc/grpc-js'
import { ExceptionFactory, UNKNOWN_EXCEPTION } from '../exceptions'

@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): Observable<never> {
    const rpcCtx = host.switchToRpc()
    const call = rpcCtx.getContext() as any
    const methodName = call?.call?.method || 'unknown-method'
    const module = process.env.MODULE_NAME || 'unknown-service'

    if (exception instanceof OESExceptionBase) {
      // 处理本服务抛出的三类异常, 同时包含了 adaptor 或者client 返回的 包裹了 下游rpcexception的infra异常
      const payload = exception.toRpcStatus()
      this.logger.warn('Local business exception', {
        module,
        operation: methodName,
        errorCode: this.getErrorCode(payload.details),
        details: payload.details
      })
      return throwError(() => new RpcException(payload))
    } else {
      // 处理未知异常
      const unknownExp = ExceptionFactory.infrastructure(UNKNOWN_EXCEPTION, {
        stack: (exception as Error)?.stack,
        message: (exception as Error)?.message
      })
      const payload = unknownExp.toRpcStatus()
      this.logger.error('Unhandled unknown exception', {
        module,
        operation: methodName,
        errorCode: this.getErrorCode(payload.details),
        details: payload.details
      })
      return throwError(() => new RpcException(payload))
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
}
