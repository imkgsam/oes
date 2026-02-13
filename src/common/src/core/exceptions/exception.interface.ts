// File:
import { status } from '@grpc/grpc-js'

export interface ExceptionDefinition {
  code: string // 标准错误码
  message: string // 错误描述
  messageKey?: string // key, 通过i18n翻译
  rpcStatus: status //  rpc 返回状态码
}

export interface RpcMappableException {
  toRpcStatus(): RpcExceptionPayload
}

export interface RpcExceptionPayload {
  code: status
  message: string
  details?: Record<string, any> | string
}
