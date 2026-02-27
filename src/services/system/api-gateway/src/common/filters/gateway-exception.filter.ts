// File: src/services/system/api-gateway/src/common/filters/gateway-exception.filter.ts

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import { RpcException } from '@nestjs/microservices'
import { OESExceptionBase } from '@oes/common/core/exceptions/oes.exception'
import { AppLogger } from '@oes/common/logging/app-logger.service'
import { ExceptionFactory, UNKNOWN_EXCEPTION } from '@oes/common/core/exceptions/index'
import { status } from '@grpc/grpc-js'
import { HttpExceptionPayload } from '@oes/common/core/exceptions/exception.interface'
import { getTraceId } from '@oes/common/tracing/trace-context'

@Catch()
export class GatewayExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request>()

    const moduleName = process.env.MODULE_NAME || 'api-gateway'
    const methodName = `${req.method} ${req.originalUrl}`
    const traceId = getTraceId()

    let payload: HttpExceptionPayload

    if (exception instanceof RpcException) {
      const err = exception.getError() as any
      const details = err?.details

      payload = {
        code: this.grpcStatusToHttpStatus(err?.code ?? status.UNKNOWN),
        message: err?.message || 'Downstream service error',
        messageKey: details?.messageKey,
        traceId,
        details
      }

      this.logger.warn('Downstream RpcException', {
        module: moduleName,
        operation: methodName,
        errorCode: details?.code,
        details
      })
    } else if (exception instanceof HttpException) {
      const response = exception.getResponse()
      const statusCode = exception.getStatus()

      payload = {
        code: statusCode,
        message: typeof response === 'string' ? response : (response as any)?.message,
        traceId,
        details: typeof response === 'object' ? response : undefined
      }

      this.logger.warn('HttpException', {
        module: moduleName,
        operation: methodName,
        statusCode
      })
    } else if (exception instanceof OESExceptionBase) {
      payload = exception.toHttpPayload()
      payload.traceId = traceId

      this.logger.warn('Business exception', {
        module: moduleName,
        operation: methodName,
        errorCode: (payload.details as any)?.code,
        details: payload.details
      })
    } else {
      const unknownExp = ExceptionFactory.infrastructure(UNKNOWN_EXCEPTION, {
        message: (exception as Error)?.message,
        stack: (exception as Error)?.stack
      })
      payload = unknownExp.toHttpPayload()
      payload.traceId = traceId

      this.logger.error('Unhandled exception', {
        module: moduleName,
        operation: methodName,
        errorCode: (payload.details as any)?.code,
        details: payload.details
      })
    }

    res.status(payload.code).json(payload)
  }

  private grpcStatusToHttpStatus(code: number): number {
    switch (code) {
      case status.INVALID_ARGUMENT:
        return HttpStatus.BAD_REQUEST
      case status.NOT_FOUND:
        return HttpStatus.NOT_FOUND
      case status.ALREADY_EXISTS:
        return HttpStatus.CONFLICT
      case status.PERMISSION_DENIED:
        return HttpStatus.FORBIDDEN
      case status.UNAUTHENTICATED:
        return HttpStatus.UNAUTHORIZED
      case status.UNAVAILABLE:
      case status.DEADLINE_EXCEEDED:
        return HttpStatus.SERVICE_UNAVAILABLE
      case status.INTERNAL:
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR
    }
  }
}
