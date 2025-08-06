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
}

// export interface RpcExceptionPayload {
//     code: string      // 全局唯一错误码，如 SYS2011001
//     message: string
//     messageKey: string
//     httpStatus: number
//     details?: any
//   }
