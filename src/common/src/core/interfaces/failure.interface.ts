export interface FailureDescriptor {
  code: string
  message: string
  messageKey: string
  httpStatus?: number
  details?: any
}
