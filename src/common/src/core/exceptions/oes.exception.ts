// src/common/core/exceptions/oes.exception.ts

import { RpcExceptionPayload } from '../interfaces/exceptions.interface'

// exception 基类

export interface OESServiceError {
  code: string // 标准错误码
  message: string // 错误描述
  messageKey?: string // key, 通过i18n翻译
  httpStatus?: number // HTTP状态码
  details?: any // 调试信息，可选
}

/**
 * OESException - 所有模块内部异常的基类
 */
export class OESException extends Error {
  public readonly code: string
  public readonly message: string
  public readonly messageKey: string
  public readonly httpStatus
  public readonly details?: any

  constructor(
    code: string,
    message: string,
    messageKey?: string,
    httpStatus?: number,
    details?: any
  ) {
    super(message)
    this.code = code
    this.messageKey = messageKey
    this.httpStatus = httpStatus
    this.details = details

    // 保留堆栈信息
    Object.setPrototypeOf(this, new.target.prototype)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toRpcPayload(): RpcExceptionPayload {
    return {
      code: this.code,
      message: this.message,
      messageKey: this.messageKey,
      httpStatus: this.httpStatus,
      details: this.details
    }
  }
}
