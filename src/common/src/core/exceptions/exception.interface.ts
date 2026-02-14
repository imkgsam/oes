// File:
import { status } from '@grpc/grpc-js'
import { HttpStatus } from '@nestjs/common'

export interface ExceptionDefinition {
  code: string // 标准错误码
  message: string // 错误描述
  messageKey?: string // key, 通过i18n翻译
  rpcStatus: status //  rpc 返回状态码
}

export interface RpcMappableException {
  toRpcPayload(): RpcExceptionPayload
}

export interface HttpMappableException {
  toHttpPayload(): HttpExceptionPayload
}

export interface RpcExceptionPayload {
  code: status
  message: string
  details?: Record<string, any>
}

export interface HttpExceptionPayload {
  code: HttpStatus
  message: string
  messageKey?: string
  traceId?: string
  details?: Record<string, any>
}
