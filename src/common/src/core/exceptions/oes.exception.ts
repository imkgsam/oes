// src/common/core/exceptions/oes.exception.ts
import { status } from '@grpc/grpc-js'
import { HttpStatus } from '@nestjs/common'
import { getTraceId } from '../../tracing'
import { ExceptionDefinition, HttpExceptionPayload, RpcExceptionPayload } from './exception.interface'
import { RpcMappableException, HttpMappableException } from './exception.interface'

const getCurrentServiceName = (): string => {
  return process.env.MODULE_NAME || 'unknown-service'
}

export abstract class OESExceptionBase
  extends Error
  implements RpcMappableException, HttpMappableException
{
  public readonly definition: ExceptionDefinition
  public readonly additionalDetails: any

  constructor(def: ExceptionDefinition, additionalDetails?: any) {
    super(def.message)
    this.name = this.constructor.name
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
    this.definition = def
    this.additionalDetails = additionalDetails
  }

  toRpcPayload(): RpcExceptionPayload {
    return {
      grpcStatus: this.definition.rpcStatus,
      code: this.definition.code,
      message: this.definition.message,
      messageKey: this.definition.messageKey,
      details: this.normalizeDetails(),
      meta: {
        service: getCurrentServiceName(),
        timestamp: new Date().toISOString(),
        traceId: getTraceId()
      }
    }
  }

  toHttpPayload(): HttpExceptionPayload {
    return {
      code: this.definition.code,
      message: this.definition.message,
      messageKey: this.definition.messageKey,
      details: this.normalizeDetails(),
      meta: {
        service: getCurrentServiceName(),
        timestamp: new Date().toISOString(),
        traceId: getTraceId()
      }
    }
  }

  getHttpStatus() {
    return this.definition.httpStatus ?? grpcStatusToHttpStatus(this.definition.rpcStatus)
  }

  getRpcStatus() {
    return this.definition.rpcStatus
  }

  getCode() {
    return this.definition.code
  }

  getI18nKey() {
    return this.definition.messageKey
  }

  private normalizeDetails(): Record<string, any> | undefined {
    if (this.additionalDetails == null) {
      return undefined
    }

    if (typeof this.additionalDetails === 'object' && !Array.isArray(this.additionalDetails)) {
      return this.additionalDetails
    }

    return {
      value: this.additionalDetails
    }
  }
}

export class DomainException extends OESExceptionBase {}
export class InfrastructureException extends OESExceptionBase {}
export class ApplicationException extends OESExceptionBase {}

/**
 * gRPC Status -> HTTP Status 映射
 */
function grpcStatusToHttpStatus(code: number): number {
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
    case status.UNAVAILABLE:
    case status.DEADLINE_EXCEEDED:
      return HttpStatus.SERVICE_UNAVAILABLE
    case status.INTERNAL:
    default:
      return HttpStatus.INTERNAL_SERVER_ERROR
  }
}
