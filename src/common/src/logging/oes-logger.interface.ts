export interface LogMeta {
  module?: string
  operation?: string
  errorCode?: string
  details?: any
}

export interface OesLogger {
  debug(message: string, meta?: LogMeta): void
  info(message: string, meta?: LogMeta): void
  warn(message: string, meta?: LogMeta): void
  error(message: string, meta?: LogMeta): void
}
