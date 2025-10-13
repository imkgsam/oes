import { RawError } from './exceptions.interface'

export interface RpcRequest<T = unknown> {
  data: T | null
  meta: RpcRequestMeta
}

export interface RpcResponse<T = unknown> {
  code: string // 成功或错误码
  message: string // 成功或错误信息
  messageKey?: string // 错误信息key
  data?: T | null // 返回数据
  meta: ResponseMeta // 响应元数据
}

export interface RpcRequestMeta {
  traceId: string // 全局链路ID
  spanId: string // 当前spanID
  parentSpanId?: string // 父spanID
  timestamp?: string // 请求发起时间
  caller?: string // 调用方模块名
  pattern?: string // RPC 调用模式，用于测试环境调试
}

export interface ResponseMeta {
  traceId: string // 全局链路ID
  spanId: string // 当前spanID
  parentSpanId: string // 父spanID
  timestamp: string // 请求恢复时间
  durationMs?: number //调用耗时
  module: string // 当前模块名
  callTrace: CallTrace[] // 全链路调用轨迹
  warnings: RpcModuleWarnings // 按模块分组的警告，用于记录调用过程中的警告信息
}

export type RpcModuleWarnings = Record<string, CBError[]>

// 定义 code-based error 结构, 从rawerror转换成cberror， 主要是将subcode 转换成全局的code
export interface CBError {
  code: string
  message: string
  messageKey?: string
  details?: any // 错误详情
}

export interface CallTrace {
  traceId: string
  module: string
  spanId: string
  parentSpanId?: string
  startTime: string
  endTime: string
  pattern?: string // 在测试环境中显示 RPC 调用的模式/路径
}

export type RpcModuleErrors = Record<string, RawError>

export interface RpcControllerResult<T = unknown> {
  data?: T // 返回业务数据
  warnings?: CBError[] // 本服务产生的code-based error
  error?: RawError // 本服务产生的raw error, interceptor 再拼接成 CBERROR
  downstreamMeta?: ResponseMeta[] // 下游服务原始返回结果中的meta
}
