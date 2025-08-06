export interface RpcRequest<T = unknown> {
  payload: T
  meta: RpcRequestMeta
}

export interface RpcRequestMeta {
  traceId: string
  spanId: string
  timestamp: string
}

export interface RpcResponse<T = unknown> {
  code: string
  message: string
  messageKey: string
  data: T
  meta: RpcResponseMeta
}

export interface RpcResponseMeta {
  traceId?: string
  spanId?: string
  timestamp: string
  callStack: string[]
  module: string
  warnings?: RpcResponseWarning[]
}

export interface RpcResponseWarning {
  code: string
  message: string
  messageKey: string
}
