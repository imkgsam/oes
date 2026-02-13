// src/common/core/exceptions/oes.exception.ts

import { status } from '@grpc/grpc-js'
import { ExceptionDefinition, RpcExceptionPayload } from './exception.interface'
import { RpcMappableException } from './exception.interface'

const getCurrentServiceName = (): string => {
  return process.env.MODULE_NAME || 'unknown-service'
}

export abstract class OESExceptionBase extends Error implements RpcMappableException {
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

  toRpcStatus(): RpcExceptionPayload {
    const safeInternalDetails =
      this.internalDetails && typeof this.internalDetails === 'object'
        ? this.internalDetails
        : { raw: this.internalDetails }
    return {
      code: this.definition.rpcStatus,
      message: this.definition.message,
      details: {
        code: this.definition.code,
        messageKey: this.definition.messageKey,
        internalDetails: safeInternalDetails,
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
