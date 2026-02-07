// src/common/core/exceptions/oes.exception.ts

import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from './exception.interface'
import { RpcMappableException } from './exception.interface'

const getCurrentServiceName = (): string => {
  return process.env.MODULE_NAME || 'unknown-service'
}

export abstract class OESExceptionBase extends Error implements RpcMappableException {
  public readonly definition: ExceptionDefinition
  public readonly args: any[]
  public readonly internalDetails: any

  constructor(def: ExceptionDefinition, args?: any[], internalDetails?: any) {
    super(def.message)
    this.name = this.constructor.name
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
    this.definition = def
    this.args = args
    this.internalDetails = internalDetails
  }

  toRpcStatus(): { code: status; message: string; details?: Record<string, any> | string } {
    return {
      code: this.definition.rpcStatus,
      message: this.definition.message,
      details: {
        code: this.definition.code,
        messageKey: this.definition.messageKey,
        args: this.args,
        internalDetails: this.internalDetails,
        service: getCurrentServiceName()
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
