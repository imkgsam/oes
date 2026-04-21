import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import { RpcException } from '@nestjs/microservices'
import {
  ExceptionFactory,
  HttpExceptionPayload,
  OESExceptionBase,
  UNKNOWN_EXCEPTION,
  VALIDATION_FAILED
} from '@oes/common/exceptions'
import { AppLogger } from '@oes/common/logging'
import { status } from '@grpc/grpc-js'
import { getTraceId, recordExceptionToActiveSpan } from '@oes/common/tracing'

@Catch()
export class GatewayExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request>()

    recordExceptionToActiveSpan(exception)

    const moduleName = process.env.MODULE_NAME || 'api-gateway'
    const methodName = `${req.method} ${req.originalUrl}`
    const traceId = getTraceId()
    const requestId = req.header('x-request-id') ?? undefined

    let payload: HttpExceptionPayload
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR

    if (exception instanceof RpcException) {
      const err = this.normalizeRpcPayload(exception.getError())
      httpStatus = this.grpcStatusToHttpStatus(err.grpcStatus)

      payload = {
        code: err.code,
        message: err.message || 'Downstream service error',
        messageKey: err.messageKey,
        details: err.details,
        meta: {
          traceId,
          requestId,
          timestamp: new Date().toISOString()
        }
      }

      this.logger.warn('Downstream RpcException', {
        module: moduleName,
        operation: methodName,
        errorCode: err.code,
        details: err.details,
        traceId
      })
    } else if (exception instanceof HttpException) {
      httpStatus = exception.getStatus()
      payload = this.mapHttpException(exception, traceId, requestId)

      this.logger.warn('HttpException', {
        module: moduleName,
        operation: methodName,
        statusCode: httpStatus,
        errorCode: payload.code,
        traceId
      })
    } else if (exception instanceof OESExceptionBase) {
      payload = exception.toHttpPayload()
      httpStatus = exception.getHttpStatus()
      payload.meta = {
        ...payload.meta,
        traceId,
        requestId,
        timestamp: payload.meta?.timestamp ?? new Date().toISOString()
      }

      this.logger.warn('Business exception', {
        module: moduleName,
        operation: methodName,
        errorCode: payload.code,
        details: payload.details,
        traceId
      })
    } else {
      const unknownExp = ExceptionFactory.infrastructure(UNKNOWN_EXCEPTION, {
        message: (exception as Error)?.message,
        stack: (exception as Error)?.stack
      })
      payload = unknownExp.toHttpPayload()
      httpStatus = unknownExp.getHttpStatus()
      payload.meta = {
        ...payload.meta,
        traceId,
        requestId,
        timestamp: payload.meta?.timestamp ?? new Date().toISOString()
      }

      this.logger.error('Unhandled exception', {
        module: moduleName,
        operation: methodName,
        errorCode: payload.code,
        details: payload.details,
        traceId
      })
    }

    res.status(httpStatus).json(payload)
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
      case status.FAILED_PRECONDITION:
        return HttpStatus.INTERNAL_SERVER_ERROR
      case status.RESOURCE_EXHAUSTED:
        return HttpStatus.TOO_MANY_REQUESTS
      case status.UNAVAILABLE:
      case status.DEADLINE_EXCEEDED:
        return HttpStatus.SERVICE_UNAVAILABLE
      case status.INTERNAL:
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR
    }
  }

  private normalizeRpcPayload(error: unknown): {
    grpcStatus: number
    code: string
    message: string
    messageKey?: string
    details?: Record<string, any>
  } {
    if (!error || typeof error !== 'object') {
      return {
        grpcStatus: status.UNKNOWN,
        code: UNKNOWN_EXCEPTION.code,
        message: 'Downstream service error'
      }
    }

    const candidate = error as any
    return {
      grpcStatus: candidate.grpcStatus ?? candidate.code ?? status.UNKNOWN,
      code:
        typeof candidate.code === 'string'
          ? candidate.code
          : candidate.details?.code ?? UNKNOWN_EXCEPTION.code,
      message: candidate.message ?? 'Downstream service error',
      messageKey: candidate.messageKey,
      details: candidate.details
    }
  }

  private mapHttpException(
    exception: HttpException,
    traceId?: string,
    requestId?: string
  ): HttpExceptionPayload {
    const response = exception.getResponse()
    const statusCode = exception.getStatus()
    const responseObject =
      typeof response === 'object' && response !== null ? (response as Record<string, any>) : undefined
    const message =
      typeof response === 'string'
        ? response
        : Array.isArray((response as any)?.message)
          ? (response as any).message.join('; ')
          : (response as any)?.message ?? exception.message

    if (responseObject?.code && typeof responseObject.code === 'string') {
      return {
        code: responseObject.code,
        message,
        messageKey:
          typeof responseObject.messageKey === 'string'
            ? responseObject.messageKey
            : undefined,
        details: responseObject.details ?? responseObject,
        meta: {
          traceId,
          requestId,
          timestamp: new Date().toISOString()
        }
      }
    }

    if (statusCode === HttpStatus.BAD_REQUEST) {
      return {
        code: VALIDATION_FAILED.code,
        message,
        messageKey: VALIDATION_FAILED.messageKey,
        details: responseObject,
        meta: {
          traceId,
          requestId,
          timestamp: new Date().toISOString()
        }
      }
    }

    return {
      code: UNKNOWN_EXCEPTION.code,
      message,
      messageKey: UNKNOWN_EXCEPTION.messageKey,
      details: responseObject,
      meta: {
        traceId,
        requestId,
        timestamp: new Date().toISOString()
      }
    }
  }
}
