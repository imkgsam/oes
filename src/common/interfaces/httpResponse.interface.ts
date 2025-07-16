import { ErrorContext } from "./exceptions.interface"

export interface StandardResponse<T> {
  code: string
  message: string
  messageKey?: string
  data?: T
  details?: any
  traceId?: string
  timestamp: string
  path?: string
  debugContext?: ErrorContext
}
