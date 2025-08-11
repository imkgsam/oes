export interface RpcRequest<T = unknown> {
  data: T | null
  meta: RpcRequestMeta
}

export interface RpcResponse<T = unknown> {
  code: string // 成功或错误码
  message: string // 成功或错误信息
  messageKey?: string // 错误信息key
  data: T | null // 返回数据
  meta: RpcResponseMeta // 响应元数据
}

export interface RpcRequestMeta {
  traceId: string // 全局链路ID
  spanId: string // 当前spanID
  parentSpanId: string // 父spanID
  timestamp: string // 请求发起时间
  caller: string // 调用方模块名
}

export interface RpcResponseMeta {
  traceId: string // 全局链路ID
  spanId: string // 当前spanID
  parentSpanId: string // 父spanID
  timestamp: string // 请求恢复时间
  durationMs: number //调用耗时
  module: string // 当前模块名
  callTrace: CallTrace[] // 全链路调用轨迹
  warnings: RpcModuleWarnings // 按模块分组的警告，用于记录调用过程中的警告信息
}

export type RpcModuleWarnings = Record<string, RpcWarning[]>

export interface RpcWarning {
  code: string
  message: string
  messageKey?: string
}

export interface CallTrace {
  traceId: string
  module: string
  spanId: string
  parentSpanId?: string
  startTime: string
  endTime: string
}
