export interface RawException {
  code: string;
  message: string
  messageKey: string
  httpStatus: number
}

export interface RpcExceptionPayload {
  code: string;
  message: string
  messageKey: string
  httpStatus: number
  module: string
  details?: any
  traceId?: string
  timestamp?: string
}
