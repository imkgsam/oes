import { EXCEPTION_TYPE_PREFIX } from "../constants/res-codes/module.codes"
import { buildGlobalErrorCode } from "../helpers/exception.helper"
import { RawException, RpcExceptionPayload } from "../interfaces/exceptions.interface"

const moduleNameFromEnv = process.env.MODULE_NAME || 'UNKNOWN_MODULE'

export class RuntimeException extends Error {
  public readonly code: string
  public readonly messageKey: string
  public readonly httpStatus: number
  public readonly details?: any


  constructor(raw: RawException, details?: any) {
    super(raw.message)
    this.messageKey = raw.messageKey
    this.httpStatus = raw.httpStatus
    this.details = details
    this.code = buildGlobalErrorCode(EXCEPTION_TYPE_PREFIX.RUNTIME, moduleNameFromEnv, raw.subCode)
    Object.setPrototypeOf(this, RuntimeException.prototype)
  }

  toRpcPayload(): RpcExceptionPayload {
    return {
      code: this.code,
      message: this.message,
      messageKey: this.messageKey,
      httpStatus: this.httpStatus,
      details: this.details,
    }
  }
}
