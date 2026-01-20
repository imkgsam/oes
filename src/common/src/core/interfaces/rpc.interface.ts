import { RawError } from './exceptions.interface'
import { FailureDescriptor } from './failure.interface'
import { WarningDescriptor } from './warnings.interface'

export interface ServiceRequest<T = unknown> {
  payload: T
  context: RequestContext
}
export interface RequestContext {
  traceId: string // 全局链路ID
  spanId: string // 当前spanID
  parentSpanId?: string // 父spanID
  caller?: string // 调用方模块名
  operation?: {
    name: string
    type?: 'RPC' | 'HTTP' | 'EVENT' | 'CRON'
  }
  timestamp?: string // 请求发起时间
}

export interface ServiceResponse<T = unknown> {
  success: boolean // 是否成功
  data?: T
  failure?: FailureDescriptor
  meta: ResponseMeta
}

export interface ResponseMeta {
  traceId: string // 全局链路ID
  module: string // 当前模块名
  spanId: string // 当前spanID
  parentSpanId?: string // 父spanID
  timestamp: string // 请求恢复时间
  durationMs?: number //调用耗时
  callTrace: CallTrace[] // 全链路调用轨迹
  warnings: Record<string, WarningDescriptor[]>
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

// ------------------------------------------------------------------------
// 定义 code-based error 结构, 从rawerror转换成cberror， 主要是将subcode 转换成全局的code
export interface CBError {
  code: string
  message: string
  messageKey?: string
  details?: any // 错误详情
}
export type RpcModuleWarnings = Record<string, CBError[]>
export type RpcModuleErrors = Record<string, RawError>

export interface RpcControllerResult<T = unknown> {
  data?: T // 返回业务数据
  warnings?: CBError[] // 本服务产生的code-based error
  error?: RawError // 本服务产生的raw error, interceptor 再拼接成 CBERROR
  downstreamMeta?: ResponseMeta[] // 下游服务原始返回结果中的meta
}
