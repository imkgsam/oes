export interface RpcRequest<T = unknown> {
  payload: T
  meta: RpcRequestMeta
}

export interface RpcRequestMeta {
  traceId: string
  spanId: string
  timestamp: string
  caller: string
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
  callStack: CallTrace[]
  module: string
  warnings: RpcErrorWarning[]
}

export interface RpcErrorWarning {
  code: string
  message: string
  messageKey: string
  module: string
}

export interface CallTrace {
  id: string
  module: string
  parentId: string
}
