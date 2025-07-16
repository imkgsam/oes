export interface RawException {
  subCode: string    // 模块内错误码，如 '0001', '1001' 等
  message: string
  messageKey: string
  httpStatus: number
}
export interface RpcExceptionPayload {
  code: string      // 全局唯一错误码，如 SYS2011001
  message: string
  messageKey: string
  httpStatus: number
  details?: any
}

export interface ErrorContext {
  module: string;           // 当前服务名
  callStack: string[];      // 异常传播路径（微服务名数组）
  traceId?: string;         // 分布式追踪 ID（OpenTelemetry）
  spanId?: string;          // 当前操作 ID
  timestamp: string;        // 错误首次发生时间（ISO 格式）
  isPropagated?: boolean;   // 是否已跨服务传播
}

export interface RpcError {
  error: RpcExceptionPayload
  context: ErrorContext
}