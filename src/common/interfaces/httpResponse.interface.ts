export interface StandardResponse<T> {
  code: string
  message: string
  data: T | null
  traceId?: string
  timestamp: number
  path?: string
}
