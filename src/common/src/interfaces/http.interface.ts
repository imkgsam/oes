import { RawError } from './exceptions.interface'
import { ResponseMeta, CBError } from './rpc.interface'

export interface HttpResponse<T = any> {
  code: string
  message: string
  messageKey?: string
  data?: T
  details?: any
  meta: HttpResponseMeta
}

export interface HttpRequest<T = any> {
  code: string
  message: string
  messageKey?: string
  data?: T
  details?: any
  meta: HttpResponseMeta
}

export interface HttpResponseMeta extends ResponseMeta {
  path?: string
}

export interface HttpControllerResult<T = unknown> {
  data?: T // 返回业务数据
  warnings?: CBError[] // 本服务产生的code-based error
  error?: RawError // 本服务产生的raw error, interceptor 再拼接成 CBERROR
  downstreamMeta?: ResponseMeta[] // 下游服务原始返回结果中的meta
}
