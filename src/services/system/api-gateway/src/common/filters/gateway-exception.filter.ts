// src/common/core/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import { RpcException } from '@nestjs/microservices'
import { OESExceptionBase } from '@oes/common/core/exceptions/oes.exception'
import { AppLogger } from '@oes/common/logging/app-logger.service'
import { ExceptionFactory, UNKNOWN_EXCEPTION } from '@oes/common/core/exceptions/index'
import { status } from '@grpc/grpc-js'
import { HttpExceptionPayload } from '@oes/common/core/exceptions/exception.interface'
import { trace } from '@opentelemetry/api'

@Catch()
export class GatewayExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request>()

    const moduleName = process.env.MODULE_NAME || 'unknown-service'
    const methodName = req.method + ' ' + req.originalUrl

    //获取当前的trace
    const activeSpan = trace.getActiveSpan()
    const traceId = activeSpan?.spanContext().traceId

    let payload: HttpExceptionPayload

    if (exception instanceof RpcException) {
      // 下游服务返回的异常，透传
      const err = exception.getError() as any
      const details = err?.details

      payload = {
        code: this.grpcStatusToHttpStatus(err?.code ?? status.UNKNOWN),
        message: err?.message || 'Downstream service error',
        messageKey: details?.messageKey,
        traceId,
        details
      }

      this.logger.warn('Propagating downstream RpcException', {
        module: moduleName,
        operation: methodName,
        errorCode: details?.code,
        details
      })
    } else if (exception instanceof OESExceptionBase) {
      // 本服务抛出的三类异常（包括包裹下游异常的 infra 异常）
      const payload = exception.toHttpPayload()
      payload.traceId = traceId
      this.logger.warn('Local business exception', {
        module: moduleName,
        operation: methodName,
        errorCode: (payload.details as any)?.code,
        details: payload.details
      })
    } else {
      // 未知异常，包装成 infra
      const unknownExp = ExceptionFactory.infrastructure(UNKNOWN_EXCEPTION, {
        message: (exception as Error)?.message,
        stack: (exception as Error)?.stack
      })
      const payload = unknownExp.toHttpPayload()
      payload.traceId = traceId
      this.logger.error('Unhandled unknown exception', {
        module: moduleName,
        operation: methodName,
        errorCode: (payload.details as any)?.code,
        details: payload.details
      })
    }

    res.status(payload.code).json(payload)
  }

  /**
   * gRPC Status -> HTTP Status 映射
   */
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
