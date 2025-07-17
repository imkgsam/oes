import { Catch, ArgumentsHost, RpcExceptionFilter, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { BusinessException } from '../exceptions/business.exception';
import { SystemException } from '../exceptions/system.exception';
import { RpcError } from '../interfaces/exceptions.interface';
import { Observable, throwError } from 'rxjs';
import { buildGlobalErrorCode, toRpcException } from '../helpers/exception.helper';
import { getTraceId } from '../modules/trace/trace-context';
import { GLOBAL_RUNTIME_ERRORS } from '../constants/res-codes/runtime.errors';
import { EXCEPTION_TYPE_PREFIX } from '../constants/res-codes/module.codes';

@Catch() // 无参数 → 捕获所有异常
export class MicroserviceExceptionsFilter implements RpcExceptionFilter {
  private readonly logger = new Logger(MicroserviceExceptionsFilter.name);
  constructor(private readonly moduleName: string = process.env.MODULE_NAME) { }

  catch(exception: BusinessException | SystemException | RpcException | unknown, host: ArgumentsHost) {
    this.logger.error('in MicroserviceExceptionsFilter catch:', exception);

    const traceId = getTraceId() || undefined

    if (exception instanceof RpcException) {
      this.logger.error('Caught RpcException:');
      return this.handleRpcException(exception)
    }

    if (exception instanceof BusinessException) {
      this.logger.error('Caught BusinessException:');
      return this.handleBusinessException(exception, host, traceId)
    }

    if (exception instanceof SystemException) {
      this.logger.error('Caught SystemException:');
      return this.handleSystemException(exception, host, traceId)
    }

    this.logger.error('Caught Unknown Exception:');
    return this.handleUnknownException(exception, host, traceId)
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
    this.logger.error('in handleUnknownException', exception)
    const details = exception instanceof Error ? { stack: exception.stack } : { raw: exception }
    return throwError(() =>
      toRpcException(
        {
          code: buildGlobalErrorCode(EXCEPTION_TYPE_PREFIX.RUNTIME, this.moduleName, GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.subCode),
          message: exception?.message || GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.message,
          messageKey: GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.messageKey,
          httpStatus: GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.httpStatus,
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