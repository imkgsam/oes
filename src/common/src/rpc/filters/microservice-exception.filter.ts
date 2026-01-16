import {
  Catch,
  ArgumentsHost,
  RpcExceptionFilter,
  Logger,
  BadRequestException
} from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { BusinessException } from '../exceptions/business.exception'
import { SystemException } from '../exceptions/system.exception'
import { RuntimeException } from '../exceptions/runtime.exception'
import { RpcError } from '../../core/interfaces/exceptions.interface'
import { RpcRequest } from '../../core/interfaces/rpc.interface'
import { Observable, throwError } from 'rxjs'
import { buildGlobalErrorCode, toRpcException } from '../../../helpers/exception.helper'
import { getTraceId } from '../../../modules/tracing/trace-context'
import { GLOBAL_RUNTIME_ERRORS } from '../../../constants/res-codes/errors/runtime.errors'
import { EXCEPTION_TYPE_PREFIX } from '../constants/res-codes/module.codes'
import { envConfig } from '../../../helpers/env.helper'

@Catch() // 无参数 → 捕获所有异常
export class MicroserviceExceptionsFilter implements RpcExceptionFilter {
  private readonly logger = new Logger(MicroserviceExceptionsFilter.name)
  constructor(private readonly moduleName: string = process.env.MODULE_NAME) {}

  catch(
    exception:
      | BusinessException
      | SystemException
      | RuntimeException
      | RpcException
      | BadRequestException,
    host: ArgumentsHost
  ) {
    this.logger.error('in MicroserviceExceptionsFilter catch:', exception)

    const traceId = getTraceId() || undefined

    if (exception instanceof RpcException) {
      this.logger.error('Caught RpcException:')
      return this.handleRpcException(exception)
    }

    if (exception instanceof BadRequestException) {
      this.logger.error('Caught BadRequestException (Validation Error):')
      return this.handleValidationException(exception, host, traceId)
    }

    if (exception instanceof BusinessException) {
      this.logger.error('Caught BusinessException:')
      return this.handleBusinessException(exception, host, traceId)
    }

    if (exception instanceof SystemException) {
      this.logger.error('Caught SystemException:')
      return this.handleSystemException(exception, host, traceId)
    }

    this.logger.error('Caught Unknown Exception:')
    return this.handleUnknownException(exception, host, traceId)
  }

  // 处理从其他模块抛出的rpc异常(可能是业务异常，也可能是系统异常)
  private handleRpcException(exception: RpcException): Observable<any> {
    const rpcError = exception.getError() as RpcError
    if (rpcError?.error && rpcError?.context) {
      rpcError.context.callStack = [...(rpcError.context.callStack || []), this.moduleName]
      rpcError.context.isPropagated = true
      return throwError(() => new RpcException(rpcError))
    }
    return this.handleUnknownException(exception)
  }

  // 处理验证异常
  private handleValidationException(
    exception: BadRequestException,
    host: ArgumentsHost,
    traceId?: string
  ): Observable<any> {
    const response = exception.getResponse() as { message?: string | string[] }
    const responseMessage = response?.message
    const validationMessages = Array.isArray(responseMessage)
      ? responseMessage.join('; ')
      : responseMessage || '数据验证失败'

    // 获取 RPC 上下文信息
    const rpcContext = host.switchToRpc()
    const rpcData = rpcContext.getData<RpcRequest<any>>()
    console.log('envConfig.showDebugInfo', envConfig.showDebugInfo)
    return throwError(() =>
      toRpcException(
        {
          code: buildGlobalErrorCode(
            EXCEPTION_TYPE_PREFIX.RUNTIME,
            this.moduleName,
            GLOBAL_RUNTIME_ERRORS.VALIDATION_ERROR.subCode
          ),
          message: validationMessages,
          messageKey: GLOBAL_RUNTIME_ERRORS.VALIDATION_ERROR.messageKey,
          httpStatus: GLOBAL_RUNTIME_ERRORS.VALIDATION_ERROR.httpStatus,
          details: {
            validationErrors: responseMessage,
            originalException: exception.message,
            // 在开发环境中添加更多调试信息
            ...(envConfig.showDebugInfo && {
              rpcPattern: rpcData?.meta?.pattern,
              rpcCaller: rpcData?.meta?.caller
            })
          }
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

  // 处理本模块抛出的业务异常
  private handleBusinessException(
    exception: BusinessException,
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
      })
    )
  }

  // 处理本模块抛出的系统异常
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
      })
    )
  }

  // 处理本模块抛出的未知异常
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
          code: buildGlobalErrorCode(
            EXCEPTION_TYPE_PREFIX.RUNTIME,
            this.moduleName,
            GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.subCode
          ),
          message: GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.message,
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
