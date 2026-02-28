// File: src/common/src/core/exceptions/exception.interface.ts

import { status } from '@grpc/grpc-js'
import { HttpStatus } from '@nestjs/common'

// 异常enum结构
export interface ExceptionDefinition {
  code: string // 标准错误码
  message: string // 错误描述
  rpcStatus: status //  rpc 返回状态码
  messageKey?: string // key, 通过i18n翻译
  httpStatus?: HttpStatus // http status code
}

export interface RpcMappableException {
  toRpcPayload(): ExceptionPayload
}

export interface HttpMappableException {
  toHttpPayload(): ExceptionPayload
}

export interface ExceptionPayload {
  code: status
  message: string
  details?: ExceptionPayloadDetails
}

export interface ExceptionPayloadDetails {
  messageKey?: string
  happenedAt?: string
  operation?: string
  traceId?: string
  cause?: ExceptionPayload
}
