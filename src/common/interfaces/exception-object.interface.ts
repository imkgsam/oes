export interface ExceptionObject {
  code: string
  message: string
  messageKey: string
  httpStatus: number
  module?: string
  prefixCode?: string
}
