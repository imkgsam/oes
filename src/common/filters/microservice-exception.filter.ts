import { Catch, ArgumentsHost, RpcExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { BusinessException } from '../exceptions/business.exception';
import { SystemException } from '../exceptions/system.exception';
import { ErrorContext, RpcError } from '../interfaces/exceptions.interface';
import { Observable, throwError } from 'rxjs';
import { toRpcException } from '../helpers/exception.helper';
import { getTraceId } from '../modules/trace/trace-context';
import { GLOBAL_SYSTEM_ERRORS } from '../constants/res-codes/system.errors';

@Catch() // 无参数 → 捕获所有异常
export class MicroserviceExceptionsFilter implements RpcExceptionFilter {
  private readonly moduleName = process.env.MODULE_NAME || 'UNKNOWN_MODULE'

  catch(exception: BusinessException | SystemException | RpcException | unknown, host: ArgumentsHost) {
    const traceId = getTraceId() || undefined

    if (exception instanceof RpcException) {
      return this.handleRpcException(exception)
    }

    if (exception instanceof BusinessException) {
      return this.handleBusinessException(exception, host)
    }

    if (exception instanceof SystemException) {
      return this.handleSystemException(exception, host)
    }

    return this.handleUnknownException(exception, host)
  }

  private handleRpcException(exception: RpcException): Observable<any> {
    const rpcError = exception.getError() as RpcError
    if (rpcError?.error && rpcError?.context) {
      rpcError.context.callStack = [
        ...(rpcError.context.callStack || []),
        this.moduleName,
      ]
      rpcError.context.isPropagated = true
      return throwError(() => new RpcException(rpcError))
    }
    return this.handleUnknownException(exception)
  }

  private handleBusinessException(
    exception: BusinessException,
    host: ArgumentsHost,
    traceId?: string,
  ): Observable<any> {
    return throwError(() =>
      toRpcException(exception.toRpcPayload(), {
        module: this.moduleName,
        traceId,
        callStack: [this.moduleName],
        timestamp: new Date().toISOString(),
        isPropagated: false
      })
    )
  }

  private handleSystemException(
    exception: SystemException,
    host: ArgumentsHost,
    traceId?: string
  ): Observable<any> {
    return throwError(() =>
      toRpcException(exception.toRpcPayload(), {
        module: this.moduleName,
        traceId,
        callStack: [this.moduleName],
        timestamp: new Date().toISOString(),
        isPropagated: false
      }),
    )
  }

  private handleUnknownException(
    exception: any,
    host?: ArgumentsHost,
    traceId?: string
  ): Observable<any> {
    const isProd = process.env.NODE_ENV === 'production'
    const details = exception instanceof Error ? { stack: isProd ? undefined : exception.stack } : { raw: exception }
    return throwError(() =>
      toRpcException(
        {
          code: GLOBAL_SYSTEM_ERRORS.UNKNOWN_ERROR.code,
          message: exception?.message || GLOBAL_SYSTEM_ERRORS.UNKNOWN_ERROR.message,
          messageKey: GLOBAL_SYSTEM_ERRORS.UNKNOWN_ERROR.messageKey,
          httpStatus: GLOBAL_SYSTEM_ERRORS.UNKNOWN_ERROR.httpStatus,
          details
        },
        {
          module: this.moduleName,
          traceId,
          callStack: [this.moduleName],
          isPropagated: false,
          timestamp: new Date().toISOString()
        }
      )
    )
  }

}