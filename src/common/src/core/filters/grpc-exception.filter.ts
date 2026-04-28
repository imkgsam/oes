// File: src/common/src/core/filters/grpc-exception.filter.ts

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { status } from '@grpc/grpc-js'
import { RpcException } from '@nestjs/microservices'
import { AppLogger } from '../../logging/app-logger.service'
import { Observable, throwError } from 'rxjs'
import { OESExceptionBase } from '../exceptions/oes.exception'
import { RpcExceptionPayload } from '../exceptions/exception.interface'
import { ExceptionFactory, UNKNOWN_EXCEPTION, VALIDATION_FAILED } from '../exceptions'
import { recordExceptionToActiveSpan } from '../../tracing'

@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): Observable<never> {
    recordExceptionToActiveSpan(exception)

    const rpcCtx = host.switchToRpc()
    const call = host.getArgByIndex(2)
    const methodName = this.getMethodName(call)
    const module = process.env.MODULE_NAME || 'unknown-service'

    if (exception instanceof RpcException) {
      const payload = this.normalizeRpcPayload(exception.getError())
      this.logger.warn('Downstream rpc exception', {
        module,
        operation: methodName,
        errorCode: payload.code,
        details: payload.details,
        traceId: payload.meta?.traceId
      })
      return throwError(() => this.toGrpcTransportError(payload))
    } else if (exception instanceof HttpException) {
      const payload = this.mapHttpException(exception)
      this.logger.warn('Http exception', {
        module,
        operation: methodName,
        errorCode: payload.code,
        details: payload.details,
        traceId: payload.meta?.traceId
      })
      return throwError(() => this.toGrpcTransportError(payload))
    } else if (exception instanceof OESExceptionBase) {
      const payload = exception.toRpcPayload()
      this.logger.warn('Local business exception', {
        module,
        operation: methodName,
        errorCode: payload.code,
        details: payload.details,
        traceId: payload.meta?.traceId
      })
      return throwError(() => this.toGrpcTransportError(payload))
    } else {
      const unknownExp = ExceptionFactory.infrastructure(UNKNOWN_EXCEPTION, {
        stack: (exception as Error)?.stack,
        message: (exception as Error)?.message
      })
      const payload = unknownExp.toRpcPayload()
      this.logger.error('Unhandled unknown exception', {
        module,
        operation: methodName,
        errorCode: payload.code,
        details: payload.details,
        traceId: payload.meta?.traceId
      })
      return throwError(() => this.toGrpcTransportError(payload))
    }
  }

  // Builds the gRPC transport error shape expected by @grpc/grpc-js while preserving the OES payload.
  private toGrpcTransportError(payload: RpcExceptionPayload): {
    code: number
    details: string
    message: string
  } {
    return {
      code: payload.grpcStatus,
      details: JSON.stringify(payload),
      message: payload.message
    }
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

  private normalizeRpcPayload(error: unknown): RpcExceptionPayload {
    if (!error || typeof error !== 'object') {
      return {
        grpcStatus: 2,
        code: UNKNOWN_EXCEPTION.code,
        message: 'Unknown error'
      }
    }

    const candidate = error as any
    return {
      grpcStatus: candidate.grpcStatus ?? candidate.code ?? 2,
      code: candidate.code && typeof candidate.code === 'string'
        ? candidate.code
        : candidate.details?.code ?? UNKNOWN_EXCEPTION.code,
      message: candidate.message ?? 'Unknown error',
      messageKey: candidate.messageKey,
      details: candidate.details,
      meta: candidate.meta
    }
  }

  private mapHttpException(exception: HttpException): RpcExceptionPayload {
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
        grpcStatus: this.httpStatusToGrpcStatus(statusCode),
        code: responseObject.code,
        message,
        messageKey:
          typeof responseObject.messageKey === 'string'
            ? responseObject.messageKey
            : undefined,
        details: responseObject.details ?? responseObject,
        meta: {
          service: process.env.MODULE_NAME || 'unknown-service',
          timestamp: new Date().toISOString()
        }
      }
    }

    if (statusCode === HttpStatus.BAD_REQUEST) {
      return {
        grpcStatus: this.httpStatusToGrpcStatus(statusCode),
        code: VALIDATION_FAILED.code,
        message,
        messageKey: VALIDATION_FAILED.messageKey,
        details: responseObject,
        meta: {
          service: process.env.MODULE_NAME || 'unknown-service',
          timestamp: new Date().toISOString()
        }
      }
    }

    return {
      grpcStatus: this.httpStatusToGrpcStatus(statusCode),
      code: this.defaultHttpExceptionCode(statusCode),
      message,
      messageKey: undefined,
      details: responseObject,
      meta: {
        service: process.env.MODULE_NAME || 'unknown-service',
        timestamp: new Date().toISOString()
      }
    }
  }

  private httpStatusToGrpcStatus(httpStatus: number): status {
    switch (httpStatus) {
      case HttpStatus.BAD_REQUEST:
        return status.INVALID_ARGUMENT
      case HttpStatus.UNAUTHORIZED:
        return status.UNAUTHENTICATED
      case HttpStatus.FORBIDDEN:
        return status.PERMISSION_DENIED
      case HttpStatus.NOT_FOUND:
        return status.NOT_FOUND
      case HttpStatus.CONFLICT:
        return status.ALREADY_EXISTS
      case HttpStatus.PRECONDITION_FAILED:
        return status.FAILED_PRECONDITION
      case HttpStatus.TOO_MANY_REQUESTS:
        return status.RESOURCE_EXHAUSTED
      case HttpStatus.SERVICE_UNAVAILABLE:
        return status.UNAVAILABLE
      default:
        return status.INTERNAL
    }
  }

  private defaultHttpExceptionCode(httpStatus: number): string {
    switch (httpStatus) {
      case HttpStatus.UNAUTHORIZED:
        return 'HTTP_UNAUTHENTICATED'
      case HttpStatus.FORBIDDEN:
        return 'HTTP_PERMISSION_DENIED'
      case HttpStatus.NOT_FOUND:
        return 'HTTP_NOT_FOUND'
      case HttpStatus.CONFLICT:
        return 'HTTP_ALREADY_EXISTS'
      case HttpStatus.PRECONDITION_FAILED:
        return 'HTTP_FAILED_PRECONDITION'
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'HTTP_RESOURCE_EXHAUSTED'
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'HTTP_UNAVAILABLE'
      default:
        return 'HTTP_INTERNAL_ERROR'
    }
  }
}
