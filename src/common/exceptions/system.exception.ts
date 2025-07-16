import {  RpcExceptionPayload } from "../interfaces/exceptions.interface"

export class SystemException extends Error {
  public readonly code: string
  public readonly messageKey: string
  public readonly httpStatus: number
  public readonly details?: any


  constructor(code:string, message:string, messageKey: string, httpStatus: number, details?: any) {
    super(message)
    this.code = code
    this.messageKey = messageKey
    this.httpStatus = httpStatus
    this.details = details
    Object.setPrototypeOf(this, SystemException.prototype)
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
