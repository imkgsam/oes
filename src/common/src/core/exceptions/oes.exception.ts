// src/common/core/exceptions/oes.exception.ts
import { status } from '@grpc/grpc-js'
import { HttpStatus } from '@nestjs/common'
import {
  ExceptionDefinition,
  HttpExceptionPayload,
  RpcExceptionPayload
} from './exception.interface'
import { RpcMappableException, HttpMappableException } from './exception.interface'

const getCurrentServiceName = (): string => {
  return process.env.MODULE_NAME || 'unknown-service'
}

export abstract class OESExceptionBase
  extends Error
  implements RpcMappableException, HttpMappableException
{
  public readonly definition: ExceptionDefinition
  public readonly internalDetails: any

  constructor(def: ExceptionDefinition, internalDetails?: any) {
    super(def.message)
    this.name = this.constructor.name
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
    this.definition = def
    this.internalDetails = internalDetails
  }

  toRpcPayload(): RpcExceptionPayload {
    return {
      code: this.definition.rpcStatus,
      message: this.definition.message,
      details: {
        code: this.definition.code,
        messageKey: this.definition.messageKey,
        internalDetails: this.internalDetails,
        service: getCurrentServiceName(),
        timestamp: new Date().toISOString()
      }
    }
  }

  toHttpPayload(): HttpExceptionPayload {
    return {
      code: grpcStatusToHttpStatus(this.definition.rpcStatus),
      message: this.definition.message,
      messageKey: this.definition.messageKey,
      details: {
        code: this.definition.code,
        internalDetails: this.internalDetails,
        service: getCurrentServiceName(),
        timestamp: new Date().toISOString()
      }
    }
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
    case status.UNAVAILABLE:
    case status.DEADLINE_EXCEEDED:
      return HttpStatus.SERVICE_UNAVAILABLE
    case status.INTERNAL:
    default:
      return HttpStatus.INTERNAL_SERVER_ERROR
  }
}
