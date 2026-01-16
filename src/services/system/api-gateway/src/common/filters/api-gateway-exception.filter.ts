import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { buildGlobalErrorCode, isRpcError } from '@oes/common/helpers/exception.helper'
import { EXCEPTION_TYPE_PREFIX } from '@oes/common/constants/res-codes/module.codes'
import { HttpResponse } from '@oes/common/final/core/interfaces/http.interface'
import { getTraceId } from '@oes/common/modules/tracing/trace-context'
import { GLOBAL_RUNTIME_ERRORS } from '@oes/common/constants/res-codes/runtime.errors'
import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { envConfig } from '@oes/common/helpers/env.helper'

@Catch()
export class ApiGatewayExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiGatewayExceptionsFilter.name)

  constructor(private readonly moduleName: string = process.env.MODULE_NAME || 'UNKNOWN') {}
  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.error('in ApiGatewayExceptionsFilter catch: ', exception)
    const ctx = host.switchToHttp()
    const response: Response = ctx.getResponse()
    const request: Request = ctx.getRequest()
    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let responseBody = this.buildDefaultResponse(request.url)
    if (exception instanceof HttpException) {
      this.logger.error('Caught HttpException:')
      const { statusCode, body } = this.handleHttpException(exception, request.url)
      status = statusCode
      responseBody = body
    } else if (exception instanceof RpcException) {
      this.logger.error('Caught RpcException:')
      const { statusCode, body } = this.handleRpcException(exception, request.url)
      status = statusCode
      responseBody = body
    } else {
      this.logger.error('Caught unknown Exception:')
      const { statusCode, body } = this.handleGenericError(exception, request.url)
      status = statusCode
      responseBody = body
    }
    response.status(status).json(responseBody)
  }

  private buildDefaultResponse(path: string): HttpResponse<any> {
    console.log('in buildDefaultResponse', path)
    return {
      code: buildGlobalErrorCode(
        EXCEPTION_TYPE_PREFIX.RUNTIME,
        this.moduleName,
        GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.subCode
      ),
      message: GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.message,
      messageKey: GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.messageKey,
      details: null,
      meta: {
        path: path,
        traceId: getTraceId(),
        spanId: uuidv4(),
        parentSpanId: 'root',
        timestamp: new Date().toISOString(),
        module: this.moduleName,
        callTrace: [],
        warnings: {}
      }
    }
  }

  private handleHttpException(exception: HttpException, path: string) {
    const statusCode = exception.getStatus()
    const res = exception.getResponse()

    let defualtRes = this.buildDefaultResponse(path)

    if (typeof res === 'string') {
      defualtRes.message = res
    } else if (typeof res === 'object' && res !== null) {
      defualtRes = {
        ...defualtRes,
        ...res,
        meta: {
          ...defualtRes.meta,
          timestamp: new Date().toISOString(),
          path: path
        }
      }
    }
    return { statusCode, body: defualtRes }
  }

  private handleRpcException(exception: RpcException, path: string) {
    const exceptionError = exception.getError?.()
    const defualtRes = this.buildDefaultResponse(path)
    let statusCode = HttpStatus.BAD_GATEWAY
    if (isRpcError(exceptionError)) {
      const { error, context } = exceptionError
      statusCode = error.httpStatus || HttpStatus.BAD_REQUEST
      defualtRes.code = error.code || defualtRes.code
      defualtRes.message = error.message || defualtRes.message
      defualtRes.messageKey = error.messageKey || defualtRes.messageKey
      defualtRes.details = error.details || undefined
      defualtRes.meta.traceId = context.traceId || defualtRes.meta.traceId
      defualtRes.meta.timestamp = context.timestamp || new Date().toISOString()
      // Convert callStack string array to CallTrace objects
      defualtRes.meta.callTrace = (context.callStack || []).map((module, index) => ({
        traceId: context.traceId || defualtRes.meta.traceId,
        module: module,
        spanId: `${context.spanId || defualtRes.meta.spanId}-${index}`,
        parentSpanId:
          index > 0 ? `${context.spanId || defualtRes.meta.spanId}-${index - 1}` : undefined,
        startTime: context.timestamp || new Date().toISOString(),
        endTime: new Date().toISOString(),
        // 在开发环境中添加 pattern 信息
        ...(envConfig.showRpcPattern && {
          pattern: (error.details as { rpcPattern?: string })?.rpcPattern
        })
      }))
      // 保持 API Gateway 的模块名，不覆盖为下游服务的模块名
      // defualtRes.meta.module = context.module || defualtRes.meta.module
      defualtRes.meta.spanId = context.spanId || defualtRes.meta.spanId
    } else {
      if (typeof exceptionError === 'string') defualtRes.message = exceptionError
      if (typeof exceptionError === 'object') defualtRes.details = exceptionError
    }
    return { statusCode, body: defualtRes }
  }

  private handleGenericError(exception: any, path: string) {
    const statusCode = GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.httpStatus
    const defaultRes = this.buildDefaultResponse(path)
    if (exception instanceof Error) {
      defaultRes.message = exception.message || GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.message
      defaultRes.details = {
        name: exception.name,
        stack: exception.stack
      }
    }
    if (typeof exception === 'string' || typeof exception === 'number') {
      defaultRes.message = String(exception)
      defaultRes.details = { value: exception }
    } else if (typeof exception === 'object' && exception !== null) {
      defaultRes.details = exception
    }
    return { statusCode, body: defaultRes }
  }
}
